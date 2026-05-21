import express from "express"
import {
  deleteUserByAdminController,
  getAdminDashboardController,
  getAllReportsController,
  getAllUsersController,
  getModerationQueueController,
  moderateContentController,
  updateReportStatusController,
} from "../controllers/adminController"
import { authMiddleware } from "../middleware/authMiddleware"
import { restrictTo } from "../middleware/roleMiddleware"
import { validate } from "../middleware/validate"
import {
  adminReportsQuerySchema,
  adminUsersQuerySchema,
  deleteUserByAdminSchema,
  moderateContentSchema,
  moderationTargetParamsSchema,
  updateReportStatusSchema,
} from "../validations/adminValidation"

const router = express.Router()

router.use(authMiddleware, restrictTo("Admin"))

router.get("/dashboard", getAdminDashboardController)
router.get("/users", validate(adminUsersQuerySchema, "query"), getAllUsersController)
router.delete("/users/:userId", validate(deleteUserByAdminSchema), deleteUserByAdminController)
router.get("/reports", validate(adminReportsQuerySchema, "query"), getAllReportsController)
router.patch("/reports/:reportId/status", validate(updateReportStatusSchema), updateReportStatusController)
router.get("/moderation/queue", getModerationQueueController)
router.post(
  "/moderation/:targetType/:targetId",
  validate(moderationTargetParamsSchema, "params"),
  validate(moderateContentSchema),
  moderateContentController
)

export default router
