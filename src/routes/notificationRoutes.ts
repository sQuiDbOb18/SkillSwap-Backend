import express from "express"
import {
  getNotificationsController,
  getUnreadNotificationCountController,
  markAllNotificationsAsReadController,
  markNotificationAsReadController,
} from "../controllers/notificationController"
import { authMiddleware } from "../middleware/authMiddleware"

const router = express.Router()

router.get("/", authMiddleware, getNotificationsController)
router.get("/unread-count", authMiddleware, getUnreadNotificationCountController)
router.patch("/read-all", authMiddleware, markAllNotificationsAsReadController)
router.patch("/:notificationId/read", authMiddleware, markNotificationAsReadController)

export default router
