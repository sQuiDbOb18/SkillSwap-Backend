import { asyncHandler } from "../utils/asyncHandler"
import {
  getUnreadNotificationsCount,
  listNotifications,
  readAllNotifications,
  readNotification,
} from "../services/notificationService"

export const getNotificationsController = asyncHandler(async (req: any, res: any) => {
  const notifications = await listNotifications(req.user.userId)
  res.json(notifications)
})

export const getUnreadNotificationCountController = asyncHandler(async (req: any, res: any) => {
  const result = await getUnreadNotificationsCount(req.user.userId)
  res.json(result)
})

export const markNotificationAsReadController = asyncHandler(async (req: any, res: any) => {
  const notification = await readNotification(req.user.userId, req.params.notificationId)
  res.json(notification)
})

export const markAllNotificationsAsReadController = asyncHandler(async (req: any, res: any) => {
  const result = await readAllNotifications(req.user.userId)
  res.json(result)
})
