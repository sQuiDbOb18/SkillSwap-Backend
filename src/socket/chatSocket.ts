import { Server as HttpServer } from "http"
import { Server } from "socket.io"
import { findUserForAuthById, updateUserLastSeen } from "../repositories/userRepository"
import {
  formatMessageForUser,
  markConversationAsRead,
  markPendingMessagesAsDelivered,
  sendDirectMessage,
} from "../services/messageService"
import { verifyAccessToken } from "../utils/authToken"

let io: Server | null = null
const onlineUsers = new Map<string, number>()

const getUserRoom = (userId: string) => `user:${userId}`

const incrementOnlineUser = (userId: string) => {
  onlineUsers.set(userId, (onlineUsers.get(userId) ?? 0) + 1)
}

const decrementOnlineUser = (userId: string) => {
  const nextCount = (onlineUsers.get(userId) ?? 1) - 1

  if (nextCount <= 0) {
    onlineUsers.delete(userId)
    return
  }

  onlineUsers.set(userId, nextCount)
}

const extractSocketToken = (socket: any) => {
  const authToken = socket.handshake.auth?.token

  if (typeof authToken === "string" && authToken.trim()) {
    return authToken
  }

  const header = socket.handshake.headers?.authorization

  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice(7)
  }

  return null
}

export const initializeSocketServer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(",") ?? "*",
      methods: ["GET", "POST"],
    },
  })

  io.use(async (socket, next) => {
    try {
      const token = extractSocketToken(socket)

      if (!token) {
        return next(new Error("Authentication token is required"))
      }

      const decoded = verifyAccessToken(token)
      const user = await findUserForAuthById(decoded.userId)

      if (!user || user.deletedAt || decoded.tokenVersion !== user.tokenVersion) {
        return next(new Error("Unauthorized"))
      }

      socket.data.user = {
        userId: user.id,
      }

      next()
    } catch (error) {
      next(new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const currentUserId = socket.data.user.userId

    incrementOnlineUser(currentUserId)
    socket.join(getUserRoom(currentUserId))
    emitPresence(currentUserId, true)

    void (async () => {
      const deliveredMessages = await markPendingMessagesAsDelivered(currentUserId)
      deliveredMessages.forEach((message: any) => emitMessageDelivered(message))
    })()

    socket.on("chat:send", async (payload, callback) => {
      try {
        const createdMessage = await sendDirectMessage(
          currentUserId,
          payload?.receiverId,
          payload?.message,
          {
            recipientOnline: isUserOnline(payload?.receiverId),
          }
        )

        emitChatMessage(createdMessage)

        if (typeof callback === "function") {
          callback({ success: true, data: formatMessageForUser(currentUserId, createdMessage) })
        }
      } catch (error: any) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message ?? "Failed to send message",
          })
        }
      }
    })

    socket.on("chat:read", async (payload, callback) => {
      try {
        const result = await markConversationAsRead(currentUserId, payload?.userId)

        if (result.markedAsReadCount > 0) {
          emitConversationRead(currentUserId, payload?.userId)
        }

        if (typeof callback === "function") {
          callback({ success: true, data: result })
        }
      } catch (error: any) {
        if (typeof callback === "function") {
          callback({
            success: false,
            message: error.message ?? "Failed to mark conversation as read",
          })
        }
      }
    })

    socket.on("disconnect", () => {
      decrementOnlineUser(currentUserId)

      if (!isUserOnline(currentUserId)) {
        const lastSeenAt = new Date()
        void updateUserLastSeen(currentUserId, lastSeenAt)
        emitPresence(currentUserId, false, lastSeenAt)
      }
    })
  })

  return io
}

export const emitChatMessage = (message: { senderId: string; receiverId: string } & Record<string, any>) => {
  if (!io) {
    return
  }

  io.to(getUserRoom(message.senderId)).emit(
    "chat:message",
    formatMessageForUser(message.senderId, message)
  )
  io.to(getUserRoom(message.receiverId)).emit(
    "chat:message",
    formatMessageForUser(message.receiverId, message)
  )
}

export const emitMessageDelivered = (message: {
  id: string
  senderId: string
  receiverId: string
  deliveredAt?: Date | null
} & Record<string, any>) => {
  if (!io) {
    return
  }

  io.to(getUserRoom(message.senderId)).to(getUserRoom(message.receiverId)).emit("chat:delivered", {
    messageId: message.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    deliveredAt: message.deliveredAt ?? new Date(),
  })
}

export const emitConversationRead = (readerUserId: string, otherUserId: string) => {
  if (!io) {
    return
  }

  io.to(getUserRoom(readerUserId)).to(getUserRoom(otherUserId)).emit("chat:read", {
    userId: otherUserId,
    readByUserId: readerUserId,
  })
}

export const emitPresence = (userId: string, isOnline: boolean, lastSeenAt?: Date | null) => {
  if (!io) {
    return
  }

  io.emit("presence:update", {
    userId,
    isOnline,
    lastSeenAt: isOnline ? null : (lastSeenAt ?? null),
  })
}

export const isUserOnline = (userId: string) => {
  if (!userId) {
    return false
  }

  return onlineUsers.has(userId)
}
