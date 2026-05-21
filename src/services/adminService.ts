import { ModerationActionType, ModerationStatus, ReportStatus, ReportTargetType } from "@prisma/client"
import {
  createReportRecord,
  findOpenReportByReporterAndTarget,
  findReportById,
  findReviewForModeration,
  findSkillForModeration,
  findUserForAdminById,
  getAdminDashboardCounts,
  getModerationQueue,
  getReportsForAdmin,
  getUsersForAdmin,
  logModerationAction,
  updateReportById,
  updateReviewModeration,
  updateSkillModeration,
} from "../repositories/adminRepository"
import { softDeleteUser } from "../repositories/userRepository"
import { CustomError } from "../utils/CustomError"

const ensureAdminTargetExists = async (targetType: ReportTargetType, targetId: string) => {
  if (targetType === ReportTargetType.USER) {
    const user = await findUserForAdminById(targetId)
    if (!user) {
      throw new CustomError("Target user not found", 404)
    }

    return { targetUserId: user.id }
  }

  if (targetType === ReportTargetType.SKILL) {
    const skill = await findSkillForModeration(targetId)
    if (!skill) {
      throw new CustomError("Target skill not found", 404)
    }

    return { targetUserId: skill.userId }
  }

  const review = await findReviewForModeration(targetId)
  if (!review) {
    throw new CustomError("Target review not found", 404)
  }

  return { targetUserId: review.userId }
}

export const getAdminDashboard = async () => {
  return getAdminDashboardCounts()
}

export const getAllUsersForAdmin = async (query: {
  search?: string
  role?: string
  includeDeleted?: boolean
  page?: number
  limit?: number
}) => {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100)
  const page = Math.max(query.page ?? 1, 1)
  const result = await getUsersForAdmin({
    search: query.search,
    role: query.role,
    includeDeleted: query.includeDeleted,
    skip: (page - 1) * limit,
    take: limit,
  })

  return {
    ...result,
    page,
    limit,
    totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
  }
}

export const deleteUserAsAdmin = async (adminId: string, userId: string, reason: string) => {
  if (adminId === userId) {
    throw new CustomError("Admins cannot delete their own account from this route", 400)
  }

  const user = await findUserForAdminById(userId)
  if (!user) {
    throw new CustomError("User not found", 404)
  }

  if (user.deletedAt) {
    throw new CustomError("User has already been deleted", 400)
  }

  const deletedUser = await softDeleteUser(userId, reason)

  await logModerationAction({
    adminId,
    actionType: ModerationActionType.USER_DELETED,
    targetType: ReportTargetType.USER,
    targetId: userId,
    reason,
  })

  return {
    message: "User deleted successfully",
    user: deletedUser,
  }
}

export const createReport = async (reporterId: string, payload: {
  targetType: ReportTargetType
  targetId: string
  reason: string
  details?: string
}) => {
  const target = await ensureAdminTargetExists(payload.targetType, payload.targetId)

  if (payload.targetType === ReportTargetType.USER && payload.targetId === reporterId) {
    throw new CustomError("You cannot report yourself", 400)
  }

  const existing = await findOpenReportByReporterAndTarget({
    reporterId,
    targetType: payload.targetType,
    targetId: payload.targetId,
  })

  if (existing) {
    throw new CustomError("You already have an active report for this item", 400)
  }

  const report = await createReportRecord({
    reporterId,
    targetType: payload.targetType,
    targetId: payload.targetId,
    targetUserId: target.targetUserId,
    reason: payload.reason,
    details: payload.details,
  })

  return report
}

export const getAllReportsForAdmin = async (query: {
  status?: ReportStatus
  targetType?: ReportTargetType
  page?: number
  limit?: number
}) => {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100)
  const page = Math.max(query.page ?? 1, 1)
  const result = await getReportsForAdmin({
    status: query.status,
    targetType: query.targetType,
    skip: (page - 1) * limit,
    take: limit,
  })

  return {
    ...result,
    page,
    limit,
    totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
  }
}

export const updateReportStatusAsAdmin = async (
  adminId: string,
  reportId: string,
  payload: {
    status: ReportStatus
    adminNotes?: string
  }
) => {
  const report = await findReportById(reportId)
  if (!report) {
    throw new CustomError("Report not found", 404)
  }

  const updated = await updateReportById(reportId, {
    status: payload.status,
    adminNotes: payload.adminNotes,
    resolvedAt:
      payload.status === ReportStatus.RESOLVED || payload.status === ReportStatus.DISMISSED
        ? new Date()
        : null,
    resolvedById:
      payload.status === ReportStatus.RESOLVED || payload.status === ReportStatus.DISMISSED
        ? adminId
        : null,
  })

  await logModerationAction({
    adminId,
    actionType: ModerationActionType.REPORT_STATUS_UPDATED,
    targetType: report.targetType,
    targetId: report.targetId,
    reportId: report.id,
    reason: payload.adminNotes,
  })

  return updated
}

export const moderateContentAsAdmin = async (
  adminId: string,
  targetType: ReportTargetType,
  targetId: string,
  payload: {
    action: "FLAG" | "REMOVE" | "RESTORE"
    reason: string
    reportId?: string
  }
) => {
  if (targetType === ReportTargetType.USER) {
    throw new CustomError("Use the user management routes for user actions", 400)
  }

  const nextStatus =
    payload.action === "FLAG"
      ? ModerationStatus.FLAGGED
      : payload.action === "REMOVE"
        ? ModerationStatus.REMOVED
        : ModerationStatus.ACTIVE

  const moderationData = {
    moderationStatus: nextStatus,
    moderationReason: payload.reason,
    moderatedAt: new Date(),
  }

  let result: unknown

  if (targetType === ReportTargetType.SKILL) {
    const skill = await findSkillForModeration(targetId)
    if (!skill) {
      throw new CustomError("Skill not found", 404)
    }
    result = await updateSkillModeration(targetId, moderationData)
  } else {
    const review = await findReviewForModeration(targetId)
    if (!review) {
      throw new CustomError("Review not found", 404)
    }
    result = await updateReviewModeration(targetId, moderationData)
  }

  if (payload.reportId) {
    const report = await findReportById(payload.reportId)
    if (!report) {
      throw new CustomError("Report not found", 404)
    }

    await updateReportById(payload.reportId, {
      status: ReportStatus.RESOLVED,
      adminNotes: payload.reason,
      resolvedAt: new Date(),
      resolvedById: adminId,
    })
  }

  await logModerationAction({
    adminId,
    actionType:
      payload.action === "FLAG"
        ? ModerationActionType.CONTENT_FLAGGED
        : payload.action === "REMOVE"
          ? ModerationActionType.CONTENT_REMOVED
          : ModerationActionType.CONTENT_RESTORED,
    targetType,
    targetId,
    reportId: payload.reportId,
    reason: payload.reason,
  })

  return {
    message:
      payload.action === "FLAG"
        ? "Content flagged successfully"
        : payload.action === "REMOVE"
          ? "Content removed successfully"
          : "Content restored successfully",
    item: result,
  }
}

export const getAdminModerationQueue = async () => {
  return getModerationQueue()
}
