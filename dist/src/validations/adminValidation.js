"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderationTargetParamsSchema = exports.adminReportsQuerySchema = exports.adminUsersQuerySchema = exports.moderateContentSchema = exports.updateReportStatusSchema = exports.deleteUserByAdminSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    targetType: zod_1.z.enum(["USER", "SKILL", "REVIEW"]),
    targetId: zod_1.z.string().uuid("Target ID must be a valid UUID"),
    reason: zod_1.z.string().trim().min(3, "Reason must be at least 3 characters").max(200, "Reason must not exceed 200 characters"),
    details: zod_1.z.string().trim().max(1000, "Details must not exceed 1000 characters").optional(),
});
exports.deleteUserByAdminSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(3, "Reason must be at least 3 characters").max(300, "Reason must not exceed 300 characters"),
});
exports.updateReportStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]),
    adminNotes: zod_1.z.string().trim().max(1000, "Admin notes must not exceed 1000 characters").optional(),
});
exports.moderateContentSchema = zod_1.z.object({
    action: zod_1.z.enum(["FLAG", "REMOVE", "RESTORE"]),
    reason: zod_1.z.string().trim().min(3, "Reason must be at least 3 characters").max(300, "Reason must not exceed 300 characters"),
    reportId: zod_1.z.string().uuid("Report ID must be a valid UUID").optional(),
});
exports.adminUsersQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().min(1).optional(),
    role: zod_1.z.string().trim().min(1).optional(),
    includeDeleted: zod_1.z.coerce.boolean().optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
exports.adminReportsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"]).optional(),
    targetType: zod_1.z.enum(["USER", "SKILL", "REVIEW"]).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
exports.moderationTargetParamsSchema = zod_1.z.object({
    targetType: zod_1.z.enum(["USER", "SKILL", "REVIEW"]),
    targetId: zod_1.z.string().uuid("Target ID must be a valid UUID"),
});
