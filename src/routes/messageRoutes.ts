import express from "express"
import {
  getChatHistoryController,
  getUnreadCountController,
  listConversationsController,
  markConversationAsReadController,
  sendMessageController,
} from "../controllers/messageController"
import { authMiddleware } from "../middleware/authMiddleware"
import { rateLimit } from "../middleware/rateLimiter"
import { validate } from "../middleware/validate"
import { sendMessageSchema } from "../validations/messageValidation"

const router = express.Router()
const sendMessageLimiter = rateLimit({
  max: 20,
  windowMs: 60 * 1000,
  message: "Too many messages sent in a short time. Please slow down.",
  keyPrefix: "send-message",
})

router.get("/conversations", authMiddleware, listConversationsController)
router.get("/unread-count", authMiddleware, getUnreadCountController)
router.post("/", authMiddleware, sendMessageLimiter, validate(sendMessageSchema), sendMessageController)
router.patch("/:userId/read", authMiddleware, markConversationAsReadController)
router.get("/:userId", authMiddleware, getChatHistoryController)

export default router
