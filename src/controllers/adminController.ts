import { asyncHandler } from "../utils/asyncHandler"
import {
  deleteUserAsAdmin,
  getAdminDashboard,
  getAdminModerationQueue,
  getAllReportsForAdmin,
  getAllUsersForAdmin,
  moderateContentAsAdmin,
  updateReportStatusAsAdmin,
} from "../services/adminService"
import {
  adminReportsQuerySchema,
  adminUsersQuerySchema,
  moderationTargetParamsSchema,
} from "../validations/adminValidation"

export const getAdminDashboardController = asyncHandler(async (req: any, res: any) => {
  const result = await getAdminDashboard()
  res.json(result)
})

export const getAllUsersController = asyncHandler(async (req: any, res: any) => {
  const query = adminUsersQuerySchema.parse(req.query)
  const result = await getAllUsersForAdmin(query)
  res.json(result)
})

export const deleteUserByAdminController = asyncHandler(async (req: any, res: any) => {
  const result = await deleteUserAsAdmin(req.user.userId, req.params.userId, req.body.reason)
  res.json(result)
})

export const getAllReportsController = asyncHandler(async (req: any, res: any) => {
  const query = adminReportsQuerySchema.parse(req.query)
  const result = await getAllReportsForAdmin(query)
  res.json(result)
})

export const updateReportStatusController = asyncHandler(async (req: any, res: any) => {
  const result = await updateReportStatusAsAdmin(req.user.userId, req.params.reportId, req.body)
  res.json(result)
})

export const moderateContentController = asyncHandler(async (req: any, res: any) => {
  const params = moderationTargetParamsSchema.parse(req.params)
  const result = await moderateContentAsAdmin(
    req.user.userId,
    params.targetType,
    params.targetId,
    req.body
  )
  res.json(result)
})

export const getModerationQueueController = asyncHandler(async (req: any, res: any) => {
  const result = await getAdminModerationQueue()
  res.json(result)
})
