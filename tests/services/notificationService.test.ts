import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import { NotificationType } from "@prisma/client"
import * as notificationRepository from "../../src/repositories/notificationRepository"
import {
  getUnreadNotificationsCount,
  listNotifications,
  notifyUser,
  readAllNotifications,
  readNotification,
} from "../../src/services/notificationService"

jest.mock("../../src/repositories/notificationRepository", () => ({
  countUnreadNotifications: jest.fn(),
  createNotification: jest.fn(),
  findNotificationByIdForUser: jest.fn(),
  getNotificationsForUser: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  markNotificationAsRead: jest.fn(),
}))

const mockedNotificationRepository = notificationRepository as jest.Mocked<
  typeof notificationRepository
>

describe("notificationService", () => {
  beforeEach(() => jest.clearAllMocks())

  it("creates and lists notifications", async () => {
    const notification = { id: "notification-1" }
    mockedNotificationRepository.createNotification.mockResolvedValue(notification as never)
    mockedNotificationRepository.getNotificationsForUser.mockResolvedValue([notification] as never)

    await expect(
      notifyUser({
        userId: "user-1",
        type: NotificationType.NEW_MESSAGE,
        message: "New message",
      })
    ).resolves.toBe(notification)
    await expect(listNotifications("user-1")).resolves.toEqual([notification])
  })

  it("returns unread notification count", async () => {
    mockedNotificationRepository.countUnreadNotifications.mockResolvedValue(3 as never)
    await expect(getUnreadNotificationsCount("user-1")).resolves.toEqual({ unreadCount: 3 })
  })

  it("marks an unread notification as read", async () => {
    mockedNotificationRepository.findNotificationByIdForUser.mockResolvedValue({
      id: "notification-1",
      isRead: false,
    } as never)
    mockedNotificationRepository.markNotificationAsRead.mockResolvedValue({
      id: "notification-1",
      isRead: true,
    } as never)

    await expect(readNotification("user-1", "notification-1")).resolves.toEqual({
      id: "notification-1",
      isRead: true,
    })
  })

  it("throws when reading a missing notification", async () => {
    mockedNotificationRepository.findNotificationByIdForUser.mockResolvedValue(null)
    await expect(readNotification("user-1", "missing")).rejects.toMatchObject({
      message: "Notification not found",
      statusCode: 404,
    })
  })

  it("marks all notifications as read", async () => {
    mockedNotificationRepository.markAllNotificationsAsRead.mockResolvedValue({ count: 5 } as never)
    await expect(readAllNotifications("user-1")).resolves.toEqual({ markedAsReadCount: 5 })
  })
})
