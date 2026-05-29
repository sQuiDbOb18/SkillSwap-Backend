import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import * as messageRepository from "../../src/repositories/messageRepository"
import * as userRepository from "../../src/repositories/userRepository"
import * as notificationService from "../../src/services/notificationService"
import {
  formatMessageForUser,
  getChatHistory,
  getUnreadMessagesCount,
  listUserConversations,
  markConversationAsRead,
  sendDirectMessage,
} from "../../src/services/messageService"

jest.mock("../../src/repositories/messageRepository", () => ({
  countUnreadMessages: jest.fn(),
  createMessage: jest.fn(),
  getConversation: jest.fn(),
  getMessagesForUser: jest.fn(),
  getUndeliveredMessages: jest.fn(),
  markMessagesAsDelivered: jest.fn(),
  markConversationMessagesAsRead: jest.fn(),
}))

jest.mock("../../src/repositories/userRepository", () => ({
  findUserById: jest.fn(),
}))

jest.mock("../../src/services/notificationService", () => ({
  notifyUser: jest.fn(),
}))

const mockedMessageRepository = messageRepository as jest.Mocked<typeof messageRepository>
const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockedNotificationService = notificationService as jest.Mocked<typeof notificationService>

describe("messageService", () => {
  beforeEach(() => jest.clearAllMocks())

  it("formats own message delivery status", () => {
    expect(
      formatMessageForUser("user-1", {
        id: "message-1",
        senderId: "user-1",
        deliveredAt: new Date(),
        readAt: null,
      })
    ).toEqual(expect.objectContaining({ isOwnMessage: true, deliveryStatus: "delivered" }))
  })

  it("sends a direct message and notifies the receiver", async () => {
    const createdMessage = {
      id: "message-1",
      senderId: "sender-1",
      receiverId: "receiver-1",
      message: "Hello",
      deliveredAt: expect.any(Date),
    }
    mockedUserRepository.findUserById
      .mockResolvedValueOnce({ id: "receiver-1", fullName: "Grace Hopper" } as never)
      .mockResolvedValueOnce({ id: "sender-1", fullName: "Ada Lovelace" } as never)
    mockedMessageRepository.createMessage.mockResolvedValue(createdMessage as never)
    mockedNotificationService.notifyUser.mockResolvedValue({ id: "notification-1" } as never)

    await expect(
      sendDirectMessage("sender-1", "receiver-1", "  Hello  ", { recipientOnline: true })
    ).resolves.toBe(createdMessage)
    expect(mockedMessageRepository.createMessage).toHaveBeenCalledWith({
      senderId: "sender-1",
      receiverId: "receiver-1",
      message: "Hello",
      deliveredAt: expect.any(Date),
    })
    expect(mockedNotificationService.notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "receiver-1",
        type: "NEW_MESSAGE",
        relatedMessageId: "message-1",
      })
    )
  })

  it("rejects messages sent to yourself", async () => {
    await expect(sendDirectMessage("user-1", "user-1", "hello")).rejects.toMatchObject({
      message: "You cannot send a message to yourself",
      statusCode: 400,
    })
  })

  it("gets chat history and marks messages as read", async () => {
    mockedUserRepository.findUserById.mockResolvedValue({ id: "other-1" } as never)
    mockedMessageRepository.markConversationMessagesAsRead.mockResolvedValue({ count: 2 } as never)
    mockedMessageRepository.getConversation.mockResolvedValue([
      { id: "message-1", senderId: "other-1", deliveredAt: null, readAt: null },
    ] as never)

    await expect(getChatHistory("user-1", "other-1")).resolves.toEqual({
      messages: [
        expect.objectContaining({
          id: "message-1",
          isOwnMessage: false,
          deliveryStatus: null,
        }),
      ],
      markedAsReadCount: 2,
    })
  })

  it("lists unique conversations with unread counts", async () => {
    mockedMessageRepository.getMessagesForUser.mockResolvedValue([
      {
        id: "message-1",
        senderId: "other-1",
        receiverId: "user-1",
        readAt: null,
        deliveredAt: null,
        sender: { id: "other-1" },
        receiver: { id: "user-1" },
      },
      {
        id: "message-2",
        senderId: "user-1",
        receiverId: "other-1",
        readAt: null,
        deliveredAt: null,
        sender: { id: "user-1" },
        receiver: { id: "other-1" },
      },
    ] as never)

    const result = await listUserConversations("user-1")
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(expect.objectContaining({ unreadCount: 1 }))
  })

  it("marks a conversation as read and returns unread count zero", async () => {
    mockedUserRepository.findUserById.mockResolvedValue({ id: "other-1" } as never)
    mockedMessageRepository.markConversationMessagesAsRead.mockResolvedValue({ count: 4 } as never)
    await expect(markConversationAsRead("user-1", "other-1")).resolves.toEqual({
      userId: "other-1",
      unreadCount: 0,
      markedAsReadCount: 4,
    })
  })

  it("returns unread message count", async () => {
    mockedMessageRepository.countUnreadMessages.mockResolvedValue(7 as never)
    await expect(getUnreadMessagesCount("user-1")).resolves.toEqual({ unreadCount: 7 })
  })
})
