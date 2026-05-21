import { Prisma } from "@prisma/client"
import prisma from "../config/db"

const messageInclude: Prisma.MessageInclude = {
  sender: {
    select: {
      id: true,
      username: true,
      fullName: true,
      lastSeenAt: true,
    },
  },
  receiver: {
    select: {
      id: true,
      username: true,
      fullName: true,
      lastSeenAt: true,
    },
  },
}

export const createMessage = (data: {
  senderId: string
  receiverId: string
  message: string
  deliveredAt?: Date
}) => {
  return prisma.message.create({
    data,
    include: messageInclude,
  })
}

export const getConversation = (userId: string, otherUserId: string) => {
  return prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  })
}

export const getMessagesForUser = (userId: string) => {
  return prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
  })
}

export const markConversationMessagesAsRead = (receiverId: string, senderId: string) => {
  return prisma.message.updateMany({
    where: {
      receiverId,
      senderId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  })
}

export const countUnreadMessages = (receiverId: string) => {
  return prisma.message.count({
    where: {
      receiverId,
      readAt: null,
    },
  })
}

export const getUndeliveredMessages = (receiverId: string) => {
  const where: Prisma.MessageWhereInput = {
    receiverId,
    deliveredAt: null,
  }

  return prisma.message.findMany({
    where,
    include: messageInclude,
    orderBy: { createdAt: "asc" },
  })
}

export const markMessagesAsDelivered = (messageIds: string[]) => {
  if (messageIds.length === 0) {
    return Promise.resolve({ count: 0 })
  }

  const where: Prisma.MessageWhereInput = {
    id: {
      in: messageIds,
    },
    deliveredAt: null,
  }

  const data: Prisma.MessageUpdateManyMutationInput = {
    deliveredAt: new Date(),
  }

  return prisma.message.updateMany({
    where,
    data,
  })
}
