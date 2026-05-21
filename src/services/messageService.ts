import {
  countUnreadMessages,
  createMessage,
  getConversation,
  getMessagesForUser,
  getUndeliveredMessages,
  markMessagesAsDelivered,
  markConversationMessagesAsRead,
} from "../repositories/messageRepository"
import { findUserById } from "../repositories/userRepository"
import { CustomError } from "../utils/CustomError"
import { notifyUser } from "./notificationService"

type ConversationMessage = Awaited<ReturnType<typeof getConversation>>[number]
type UserMessage = Awaited<ReturnType<typeof getMessagesForUser>>[number]
type PendingMessage = Awaited<ReturnType<typeof getUndeliveredMessages>>[number]

const getDeliveryStatus = (message: {
  senderId: string
  deliveredAt: Date | null
  readAt: Date | null
}) => {
  if (message.readAt) {
    return "read"
  }

  if (message.deliveredAt) {
    return "delivered"
  }

  return "sent"
}

export const formatMessageForUser = (currentUserId: string, message: any) => ({
  ...message,
  isOwnMessage: message.senderId === currentUserId,
  deliveryStatus:
    message.senderId === currentUserId ? getDeliveryStatus(message) : null,
})

export const sendDirectMessage = async (
  senderId: string,
  receiverId: string,
  message: string,
  options?: {
    recipientOnline?: boolean
  }
) => {
  if (senderId === receiverId) {
    throw new CustomError("You cannot send a message to yourself", 400)
  }

  const receiver = await findUserById(receiverId)

  if (!receiver) {
    throw new CustomError("Receiver not found", 404)
  }

  const createdMessage = await createMessage({
    senderId,
    receiverId,
    message: message.trim(),
    deliveredAt: options?.recipientOnline ? new Date() : undefined,
  })

  const sender = await findUserById(senderId)

  await notifyUser({
    userId: receiverId,
    type: "NEW_MESSAGE",
    message: `New message from ${sender?.fullName ?? "another user"}.`,
    relatedMessageId: createdMessage.id,
  })

  return createdMessage
}

export const getChatHistory = async (currentUserId: string, otherUserId: string) => {
  if (!otherUserId?.trim()) {
    throw new CustomError("User ID is required", 400)
  }

  const otherUser = await findUserById(otherUserId)

  if (!otherUser) {
    throw new CustomError("User not found", 404)
  }

  const { count } = await markConversationMessagesAsRead(currentUserId, otherUserId)
  const messages = (await getConversation(currentUserId, otherUserId)).map((message: ConversationMessage) =>
    formatMessageForUser(currentUserId, message)
  )

  return {
    messages,
    markedAsReadCount: count,
  }
}

export const listUserConversations = async (currentUserId: string) => {
  const messages = await getMessagesForUser(currentUserId)
  const seenUsers = new Set<string>()
  const unreadCounts = new Map<string, number>()

  for (const message of messages) {
    if (message.receiverId === currentUserId && !message.readAt) {
      unreadCounts.set(message.senderId, (unreadCounts.get(message.senderId) ?? 0) + 1)
    }
  }

  return messages.reduce<any[]>((conversations: any[], message: UserMessage) => {
    const otherUser =
      message.senderId === currentUserId ? message.receiver : message.sender

    if (seenUsers.has(otherUser.id)) {
      return conversations
    }

    seenUsers.add(otherUser.id)
    conversations.push({
      user: otherUser,
      lastMessage: formatMessageForUser(currentUserId, message),
      unreadCount: unreadCounts.get(otherUser.id) ?? 0,
    })

    return conversations
  }, [])
}

export const markConversationAsRead = async (currentUserId: string, otherUserId: string) => {
  if (!otherUserId?.trim()) {
    throw new CustomError("User ID is required", 400)
  }

  const otherUser = await findUserById(otherUserId)

  if (!otherUser) {
    throw new CustomError("User not found", 404)
  }

  const { count } = await markConversationMessagesAsRead(currentUserId, otherUserId)

  return {
    userId: otherUserId,
    unreadCount: 0,
    markedAsReadCount: count,
  }
}

export const getUnreadMessagesCount = async (currentUserId: string) => {
  const unreadCount = await countUnreadMessages(currentUserId)

  return {
    unreadCount,
  }
}

export const markPendingMessagesAsDelivered = async (currentUserId: string) => {
  const messages = await getUndeliveredMessages(currentUserId)

  if (messages.length === 0) {
    return []
  }

  await markMessagesAsDelivered(messages.map((message: PendingMessage) => message.id))

  return messages.map((message: PendingMessage) =>
    formatMessageForUser(message.senderId, {
      ...message,
      deliveredAt: new Date(),
    })
  )
}
