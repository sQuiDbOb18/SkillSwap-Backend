import { asyncHandler } from "../utils/asyncHandler"
import { createReport } from "../services/adminService"

export const createReportController = asyncHandler(async (req: any, res: any) => {
  const report = await createReport(req.user.userId, req.body)
  res.status(201).json(report)
})
