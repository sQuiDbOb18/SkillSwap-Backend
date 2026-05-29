import { jest, describe, it, expect, beforeEach } from "@jest/globals"
import {
  formatMessageForUser,
  getChatHistory,
  getUnreadMessagesCount,
  listUserConversations,
  markConversationAsRead,
  sendDirectMessage,
} from "../../src/services/messageService"
import { emitChatMessage, emitConversationRead, isUserOnline } from "../../src/socket/chatSocket"
import {
  getChatHistoryController,
  getUnreadCountController,
  listConversationsController,
  markConversationAsReadController,
  sendMessageController,
} from "../../src/controllers/messageController"

jest.mock("../../src/services/messageService", () => ({
  formatMessageForUser: jest.fn(),
  getChatHistory: jest.fn(),
  getUnreadMessagesCount: jest.fn(),
  listUserConversations: jest.fn(),
  markConversationAsRead: jest.fn(),
  sendDirectMessage: jest.fn(),
}))

jest.mock("../../src/socket/chatSocket", () => ({
  emitChatMessage: jest.fn(),
  emitConversationRead: jest.fn(),
  isUserOnline: jest.fn(),
}))

const mockedSendDirectMessage = sendDirectMessage as jest.MockedFunction<typeof sendDirectMessage>
const mockedFormatMessageForUser = formatMessageForUser as jest.MockedFunction<
  typeof formatMessageForUser
>
const mockedGetChatHistory = getChatHistory as jest.MockedFunction<typeof getChatHistory>
const mockedListUserConversations = listUserConversations as jest.MockedFunction<
  typeof listUserConversations
>
const mockedMarkConversationAsRead = markConversationAsRead as jest.MockedFunction<
  typeof markConversationAsRead
>
const mockedGetUnreadMessagesCount = getUnreadMessagesCount as jest.MockedFunction<
  typeof getUnreadMessagesCount
>
const mockedIsUserOnline = isUserOnline as jest.MockedFunction<typeof isUserOnline>
const mockedEmitChatMessage = emitChatMessage as jest.MockedFunction<typeof emitChatMessage>
const mockedEmitConversationRead = emitConversationRead as jest.MockedFunction<
  typeof emitConversationRead
>

const createResponse = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() })
const runController = async (controller: any, req: any, res: any, next = jest.fn()) => {
  controller(req, res, next)
  await Promise.resolve()
  await Promise.resolve()
}

describe("messageController", () => {
  beforeEach(() => jest.clearAllMocks())

  it("sends, emits, formats, and returns a message", async () => {
    const rawMessage = { id: "message-1" }
    const formatted = { id: "message-1", isOwnMessage: true }
    const res = createResponse()
    mockedIsUserOnline.mockReturnValue(true)
    mockedSendDirectMessage.mockResolvedValue(rawMessage as never)
    mockedFormatMessageForUser.mockReturnValue(formatted)

    await runController(
      sendMessageController,
      { user: { userId: "sender-1" }, body: { receiverId: "receiver-1", message: "Hello" } },
      res
    )

    expect(mockedSendDirectMessage).toHaveBeenCalledWith("sender-1", "receiver-1", "Hello", {
      recipientOnline: true,
    })
    expect(mockedEmitChatMessage).toHaveBeenCalledWith(rawMessage)
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(formatted)
  })

  it("emits read events when chat history or mark-read changes messages", async () => {
    const res = createResponse()
    mockedGetChatHistory.mockResolvedValue({ messages: [], markedAsReadCount: 2 } as never)
    mockedMarkConversationAsRead.mockResolvedValue({
      userId: "other-1",
      unreadCount: 0,
      markedAsReadCount: 1,
    } as never)

    await runController(
      getChatHistoryController,
      { user: { userId: "user-1" }, params: { userId: "other-1" } },
      res
    )
    await runController(
      markConversationAsReadController,
      { user: { userId: "user-1" }, params: { userId: "other-1" } },
      res
    )

    expect(mockedEmitConversationRead).toHaveBeenCalledWith("user-1", "other-1")
    expect(mockedEmitConversationRead).toHaveBeenCalledTimes(2)
  })

  it("adds online state to listed conversations", async () => {
    const res = createResponse()
    mockedListUserConversations.mockResolvedValue([
      { user: { id: "other-1", lastSeenAt: new Date("2026-01-01T00:00:00.000Z") } },
    ] as never)
    mockedIsUserOnline.mockReturnValue(true)

    await runController(listConversationsController, { user: { userId: "user-1" } }, res)

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        user: expect.objectContaining({ id: "other-1" }),
        isOnline: true,
        lastSeenAt: null,
      }),
    ])
  })

  it("returns unread count", async () => {
    const res = createResponse()
    mockedGetUnreadMessagesCount.mockResolvedValue({ unreadCount: 4 } as never)
    await runController(getUnreadCountController, { user: { userId: "user-1" } }, res)
    expect(mockedGetUnreadMessagesCount).toHaveBeenCalledWith("user-1")
    expect(res.json).toHaveBeenCalledWith({ unreadCount: 4 })
  })
})
