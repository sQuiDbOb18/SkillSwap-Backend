import { NotificationType, Prisma } from "@prisma/client"
import prisma from "../config/db"

const prismaClient = prisma as any

const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  message: true,
  isRead: true,
  relatedBookingId: true,
  relatedMessageId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationSelect

export const createNotification = (data: {
  userId: string
  type: NotificationType
  message: string
  relatedBookingId?: string
  relatedMessageId?: string
}) => {
  return prismaClient.notification.create({
    data,
    select: notificationSelect,
  })
}

export const getNotificationsForUser = (userId: string) => {
  return prismaClient.notification.findMany({
    where: { userId },
    select: notificationSelect,
    orderBy: { createdAt: "desc" },
  })
}

export const countUnreadNotifications = (userId: string) => {
  return prismaClient.notification.count({
    where: {
      userId,
      isRead: false,
    },
  })
}

export const findNotificationByIdForUser = (id: string, userId: string) => {
  return prismaClient.notification.findFirst({
    where: {
      id,
      userId,
    },
    select: notificationSelect,
  })
}

export const markNotificationAsRead = (id: string) => {
  return prismaClient.notification.update({
    where: { id },
    data: {
      isRead: true,
    },
    select: notificationSelect,
  })
}

export const markAllNotificationsAsRead = (userId: string) => {
  return prismaClient.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  })
}
