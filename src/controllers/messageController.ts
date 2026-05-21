import { asyncHandler } from "../utils/asyncHandler"
import {
  formatMessageForUser,
  getChatHistory,
  getUnreadMessagesCount,
  listUserConversations,
  markConversationAsRead,
  sendDirectMessage,
} from "../services/messageService"
import { emitChatMessage, emitConversationRead, isUserOnline } from "../socket/chatSocket"

export const sendMessageController = asyncHandler(async (req: any, res: any) => {
  const message = await sendDirectMessage(req.user.userId, req.body.receiverId, req.body.message, {
    recipientOnline: isUserOnline(req.body.receiverId),
  })

  emitChatMessage(message)

  res.status(201).json(formatMessageForUser(req.user.userId, message))
})

export const getChatHistoryController = asyncHandler(async (req: any, res: any) => {
  const result = await getChatHistory(req.user.userId, req.params.userId)

  if (result.markedAsReadCount > 0) {
    emitConversationRead(req.user.userId, req.params.userId)
  }

  res.json(result)
})

export const listConversationsController = asyncHandler(async (req: any, res: any) => {
  const conversations = await listUserConversations(req.user.userId)

  res.json(
    conversations.map((conversation: any) => ({
      ...conversation,
      isOnline: isUserOnline(conversation.user.id),
      lastSeenAt: isUserOnline(conversation.user.id) ? null : conversation.user.lastSeenAt ?? null,
    }))
  )
})

export const markConversationAsReadController = asyncHandler(async (req: any, res: any) => {
  const result = await markConversationAsRead(req.user.userId, req.params.userId)

  if (result.markedAsReadCount > 0) {
    emitConversationRead(req.user.userId, req.params.userId)
  }

  res.json(result)
})

export const getUnreadCountController = asyncHandler(async (req: any, res: any) => {
  const result = await getUnreadMessagesCount(req.user.userId)
  res.json(result)
})
