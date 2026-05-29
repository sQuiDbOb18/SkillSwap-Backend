import { z } from "zod"

const booleanQuerySchema = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform((value) => value === "true"),
])

export const createReportSchema = z.object({
  targetType: z.enum(["USER", "SKILL", "REVIEW"]),
  targetId: z.string().uuid("Target ID must be a valid UUID"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(200, "Reason must not exceed 200 characters"),
  details: z.string().trim().max(1000, "Details must not exceed 1000 characters").optional(),
})

export const deleteUserByAdminSchema = z.object({
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(300, "Reason must not exceed 300 characters"),
})

export const updateReportStatusSchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
  adminNotes: z.string().trim().max(1000, "Admin notes must not exceed 1000 characters").optional(),
})

export const moderateContentSchema = z.object({
  action: z.enum(["FLAG", "REMOVE", "RESTORE"]),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(300, "Reason must not exceed 300 characters"),
  reportId: z.string().uuid("Report ID must be a valid UUID").optional(),
})

export const adminUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  role: z.string().trim().min(1).optional(),
  includeDeleted: booleanQuerySchema.optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const adminReportsQuerySchema = z.object({
  status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]).optional(),
  targetType: z.enum(["USER", "SKILL", "REVIEW"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

export const moderationTargetParamsSchema = z.object({
  targetType: z.enum(["USER", "SKILL", "REVIEW"]),
  targetId: z.string().uuid("Target ID must be a valid UUID"),
})
