import { NotificationType } from "@prisma/client"
import {
  countUnreadNotifications,
  createNotification,
  findNotificationByIdForUser,
  getNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../repositories/notificationRepository"
import { CustomError } from "../utils/CustomError"

export const notifyUser = async (params: {
  userId: string
  type: NotificationType
  message: string
  relatedBookingId?: string
  relatedMessageId?: string
}) => {
  return createNotification(params)
}

export const listNotifications = async (userId: string) => {
  return getNotificationsForUser(userId)
}

export const getUnreadNotificationsCount = async (userId: string) => {
  const unreadCount = await countUnreadNotifications(userId)

  return { unreadCount }
}

export const readNotification = async (userId: string, notificationId: string) => {
  const notification = await findNotificationByIdForUser(notificationId, userId)

  if (!notification) {
    throw new CustomError("Notification not found", 404)
  }

  if (notification.isRead) {
    return notification
  }

  return markNotificationAsRead(notificationId)
}

export const readAllNotifications = async (userId: string) => {
  const result = await markAllNotificationsAsRead(userId)

  return {
    markedAsReadCount: result.count,
  }
}
