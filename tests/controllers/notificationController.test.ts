import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import {
  getUnreadNotificationsCount,
  listNotifications,
  readAllNotifications,
  readNotification,
} from "../../src/services/notificationService"
import {
  getNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../../src/controllers/notificationController"

jest.mock("../../src/services/notificationService", () => ({
  getUnreadNotificationsCount: jest.fn(),
  listNotifications: jest.fn(),
  readAllNotifications: jest.fn(),
  readNotification: jest.fn(),
}))

const mockedListNotifications = listNotifications as jest.MockedFunction<typeof listNotifications>
const mockedGetUnreadNotificationsCount = getUnreadNotificationsCount as jest.MockedFunction<
  typeof getUnreadNotificationsCount
>
const mockedReadNotification = readNotification as jest.MockedFunction<typeof readNotification>
const mockedReadAllNotifications = readAllNotifications as jest.MockedFunction<
  typeof readAllNotifications
>

const createResponse = () => ({ json: jest.fn() })
const runController = async (controller: any, req: any, res: any, next = jest.fn()) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("notificationController", () => {
  beforeEach(() => jest.clearAllMocks())

  it("passes authenticated user id to notification services", async () => {
    const res = createResponse()
    mockedListNotifications.mockResolvedValue([{ id: "notification-1" }] as never)
    mockedGetUnreadNotificationsCount.mockResolvedValue({ unreadCount: 2 } as never)
    mockedReadNotification.mockResolvedValue({ id: "notification-1", isRead: true } as never)
    mockedReadAllNotifications.mockResolvedValue({ markedAsReadCount: 2 } as never)

    await runController(getNotificationsController, { user: { userId: "user-1" } }, res)
    await runController(getUnreadNotificationCountController, { user: { userId: "user-1" } }, res)
    await runController(
      markNotificationAsReadController,
      { user: { userId: "user-1" }, params: { notificationId: "notification-1" } },
      res
    )
    await runController(markAllNotificationsAsReadController, { user: { userId: "user-1" } }, res)

    expect(mockedListNotifications).toHaveBeenCalledWith("user-1")
    expect(mockedGetUnreadNotificationsCount).toHaveBeenCalledWith("user-1")
    expect(mockedReadNotification).toHaveBeenCalledWith("user-1", "notification-1")
    expect(mockedReadAllNotifications).toHaveBeenCalledWith("user-1")
  })
})
