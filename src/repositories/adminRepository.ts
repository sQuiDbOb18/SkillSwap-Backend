import { ModerationActionType, ModerationStatus, Prisma, ReportStatus, ReportTargetType } from "@prisma/client"
import prisma from "../config/db"

const adminUserSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  role: true,
  isVerified: true,
  deletedAt: true,
  deletionReason: true,
  createdAt: true,
  lastSeenAt: true,
} satisfies Prisma.UserSelect

const reportInclude = {
  reporter: {
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
    },
  },
  targetUser: {
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
    },
  },
} satisfies Prisma.ReportInclude

export const getAdminDashboardCounts = async () => {
  const [
    totalUsers,
    activeUsers,
    deletedUsers,
    openReports,
    flaggedSkills,
    removedSkills,
    flaggedReviews,
    removedReviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: { not: null } } }),
    prisma.report.count({ where: { status: { in: [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW] } } }),
    prisma.skill.count({ where: { moderationStatus: ModerationStatus.FLAGGED } }),
    prisma.skill.count({ where: { moderationStatus: ModerationStatus.REMOVED } }),
    prisma.review.count({ where: { moderationStatus: ModerationStatus.FLAGGED } }),
    prisma.review.count({ where: { moderationStatus: ModerationStatus.REMOVED } }),
  ])

  return {
    users: { total: totalUsers, active: activeUsers, deleted: deletedUsers },
    reports: { open: openReports },
    moderation: {
      flaggedSkills,
      removedSkills,
      flaggedReviews,
      removedReviews,
    },
  }
}

export const getUsersForAdmin = async (params: {
  search?: string
  role?: string
  includeDeleted?: boolean
  skip: number
  take: number
}) => {
  const where: Prisma.UserWhereInput = {
    ...(params.includeDeleted ? {} : { deletedAt: null }),
    ...(params.role ? { role: params.role } : {}),
    ...(params.search
      ? {
          OR: [
            { fullName: { contains: params.search, mode: "insensitive" } },
            { email: { contains: params.search, mode: "insensitive" } },
            { username: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelect,
      orderBy: { createdAt: "desc" },
      skip: params.skip,
      take: params.take,
    }),
    prisma.user.count({ where }),
  ])

  return { items, total }
}

export const findUserForAdminById = (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: adminUserSelect,
  })
}

export const createReportRecord = (data: {
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  targetUserId?: string
  reason: string
  details?: string
}) => {
  return prisma.report.create({
    data: {
      reporterId: data.reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      targetUserId: data.targetUserId,
      reason: data.reason,
      details: data.details,
    },
    include: reportInclude,
  })
}

export const findOpenReportByReporterAndTarget = (data: {
  reporterId: string
  targetType: ReportTargetType
  targetId: string
}) => {
  return prisma.report.findFirst({
    where: {
      reporterId: data.reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      status: { in: [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW] },
    },
  })
}

export const getReportsForAdmin = async (params: {
  status?: ReportStatus
  targetType?: ReportTargetType
  skip: number
  take: number
}) => {
  const where: Prisma.ReportWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.targetType ? { targetType: params.targetType } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: reportInclude,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: params.skip,
      take: params.take,
    }),
    prisma.report.count({ where }),
  ])

  return { items, total }
}

export const findReportById = (reportId: string) => {
  return prisma.report.findUnique({
    where: { id: reportId },
    include: reportInclude,
  })
}

export const updateReportById = (
  reportId: string,
  data: Prisma.ReportUpdateInput
) => {
  return prisma.report.update({
    where: { id: reportId },
    data,
    include: reportInclude,
  })
}

export const logModerationAction = (data: {
  adminId: string
  actionType: ModerationActionType
  targetType: ReportTargetType
  targetId: string
  reportId?: string
  reason?: string
}) => {
  return prisma.moderationLog.create({
    data,
  })
}

export const findSkillForModeration = (skillId: string) => {
  return prisma.skill.findUnique({
    where: { id: skillId },
    select: {
      id: true,
      userId: true,
      title: true,
      moderationStatus: true,
      moderationReason: true,
      moderatedAt: true,
    },
  })
}

export const updateSkillModeration = (skillId: string, data: Prisma.SkillUpdateInput) => {
  return prisma.skill.update({
    where: { id: skillId },
    data,
  })
}

export const findReviewForModeration = (reviewId: string) => {
  return prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      targetUserId: true,
      moderationStatus: true,
      moderationReason: true,
      moderatedAt: true,
    },
  })
}

export const updateReviewModeration = (reviewId: string, data: Prisma.ReviewUpdateInput) => {
  return prisma.review.update({
    where: { id: reviewId },
    data,
  })
}

export const getModerationQueue = async () => {
  const [flaggedSkills, flaggedReviews, openReports] = await Promise.all([
    prisma.skill.findMany({
      where: { moderationStatus: ModerationStatus.FLAGGED },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.review.findMany({
      where: { moderationStatus: ModerationStatus.FLAGGED },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    }),
    prisma.report.findMany({
      where: {
        status: {
          in: [ReportStatus.OPEN, ReportStatus.UNDER_REVIEW],
        },
      },
      include: reportInclude,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  return {
    flaggedSkills,
    flaggedReviews,
    openReports,
  }
}

export const getModerationLogsForExport = (params: {
  from?: Date
  to?: Date
  take: number
}) => {
  return prisma.moderationLog.findMany({
    where: {
      ...(params.from || params.to
        ? {
            createdAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    },
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: params.take,
  })
}
