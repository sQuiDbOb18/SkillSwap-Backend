"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminModerationQueue = exports.moderateContentAsAdmin = exports.updateReportStatusAsAdmin = exports.getAllReportsForAdmin = exports.createReport = exports.deleteUserAsAdmin = exports.getAllUsersForAdmin = exports.getAdminDashboard = void 0;
const client_1 = require("@prisma/client");
const adminRepository_1 = require("../repositories/adminRepository");
const userRepository_1 = require("../repositories/userRepository");
const CustomError_1 = require("../utils/CustomError");
const ensureAdminTargetExists = async (targetType, targetId) => {
    if (targetType === client_1.ReportTargetType.USER) {
        const user = await (0, adminRepository_1.findUserForAdminById)(targetId);
        if (!user) {
            throw new CustomError_1.CustomError("Target user not found", 404);
        }
        return { targetUserId: user.id };
    }
    if (targetType === client_1.ReportTargetType.SKILL) {
        const skill = await (0, adminRepository_1.findSkillForModeration)(targetId);
        if (!skill) {
            throw new CustomError_1.CustomError("Target skill not found", 404);
        }
        return { targetUserId: skill.userId };
    }
    const review = await (0, adminRepository_1.findReviewForModeration)(targetId);
    if (!review) {
        throw new CustomError_1.CustomError("Target review not found", 404);
    }
    return { targetUserId: review.userId };
};
const getAdminDashboard = async () => {
    return (0, adminRepository_1.getAdminDashboardCounts)();
};
exports.getAdminDashboard = getAdminDashboard;
const getAllUsersForAdmin = async (query) => {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const page = Math.max(query.page ?? 1, 1);
    const result = await (0, adminRepository_1.getUsersForAdmin)({
        search: query.search,
        role: query.role,
        includeDeleted: query.includeDeleted,
        skip: (page - 1) * limit,
        take: limit,
    });
    return {
        ...result,
        page,
        limit,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
    };
};
exports.getAllUsersForAdmin = getAllUsersForAdmin;
const deleteUserAsAdmin = async (adminId, userId, reason) => {
    if (adminId === userId) {
        throw new CustomError_1.CustomError("Admins cannot delete their own account from this route", 400);
    }
    const user = await (0, adminRepository_1.findUserForAdminById)(userId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    if (user.deletedAt) {
        throw new CustomError_1.CustomError("User has already been deleted", 400);
    }
    const deletedUser = await (0, userRepository_1.softDeleteUser)(userId, reason);
    await (0, adminRepository_1.logModerationAction)({
        adminId,
        actionType: client_1.ModerationActionType.USER_DELETED,
        targetType: client_1.ReportTargetType.USER,
        targetId: userId,
        reason,
    });
    return {
        message: "User deleted successfully",
        user: deletedUser,
    };
};
exports.deleteUserAsAdmin = deleteUserAsAdmin;
const createReport = async (reporterId, payload) => {
    const target = await ensureAdminTargetExists(payload.targetType, payload.targetId);
    if (payload.targetType === client_1.ReportTargetType.USER && payload.targetId === reporterId) {
        throw new CustomError_1.CustomError("You cannot report yourself", 400);
    }
    const existing = await (0, adminRepository_1.findOpenReportByReporterAndTarget)({
        reporterId,
        targetType: payload.targetType,
        targetId: payload.targetId,
    });
    if (existing) {
        throw new CustomError_1.CustomError("You already have an active report for this item", 400);
    }
    const report = await (0, adminRepository_1.createReportRecord)({
        reporterId,
        targetType: payload.targetType,
        targetId: payload.targetId,
        targetUserId: target.targetUserId,
        reason: payload.reason,
        details: payload.details,
    });
    return report;
};
exports.createReport = createReport;
const getAllReportsForAdmin = async (query) => {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const page = Math.max(query.page ?? 1, 1);
    const result = await (0, adminRepository_1.getReportsForAdmin)({
        status: query.status,
        targetType: query.targetType,
        skip: (page - 1) * limit,
        take: limit,
    });
    return {
        ...result,
        page,
        limit,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
    };
};
exports.getAllReportsForAdmin = getAllReportsForAdmin;
const updateReportStatusAsAdmin = async (adminId, reportId, payload) => {
    const report = await (0, adminRepository_1.findReportById)(reportId);
    if (!report) {
        throw new CustomError_1.CustomError("Report not found", 404);
    }
    const updated = await (0, adminRepository_1.updateReportById)(reportId, {
        status: payload.status,
        adminNotes: payload.adminNotes,
        resolvedAt: payload.status === client_1.ReportStatus.RESOLVED || payload.status === client_1.ReportStatus.DISMISSED
            ? new Date()
            : null,
        resolvedById: payload.status === client_1.ReportStatus.RESOLVED || payload.status === client_1.ReportStatus.DISMISSED
            ? adminId
            : null,
    });
    await (0, adminRepository_1.logModerationAction)({
        adminId,
        actionType: client_1.ModerationActionType.REPORT_STATUS_UPDATED,
        targetType: report.targetType,
        targetId: report.targetId,
        reportId: report.id,
        reason: payload.adminNotes,
    });
    return updated;
};
exports.updateReportStatusAsAdmin = updateReportStatusAsAdmin;
const moderateContentAsAdmin = async (adminId, targetType, targetId, payload) => {
    if (targetType === client_1.ReportTargetType.USER) {
        throw new CustomError_1.CustomError("Use the user management routes for user actions", 400);
    }
    const nextStatus = payload.action === "FLAG"
        ? client_1.ModerationStatus.FLAGGED
        : payload.action === "REMOVE"
            ? client_1.ModerationStatus.REMOVED
            : client_1.ModerationStatus.ACTIVE;
    const moderationData = {
        moderationStatus: nextStatus,
        moderationReason: payload.reason,
        moderatedAt: new Date(),
    };
    let result;
    if (targetType === client_1.ReportTargetType.SKILL) {
        const skill = await (0, adminRepository_1.findSkillForModeration)(targetId);
        if (!skill) {
            throw new CustomError_1.CustomError("Skill not found", 404);
        }
        result = await (0, adminRepository_1.updateSkillModeration)(targetId, moderationData);
    }
    else {
        const review = await (0, adminRepository_1.findReviewForModeration)(targetId);
        if (!review) {
            throw new CustomError_1.CustomError("Review not found", 404);
        }
        result = await (0, adminRepository_1.updateReviewModeration)(targetId, moderationData);
    }
    if (payload.reportId) {
        const report = await (0, adminRepository_1.findReportById)(payload.reportId);
        if (!report) {
            throw new CustomError_1.CustomError("Report not found", 404);
        }
        await (0, adminRepository_1.updateReportById)(payload.reportId, {
            status: client_1.ReportStatus.RESOLVED,
            adminNotes: payload.reason,
            resolvedAt: new Date(),
            resolvedById: adminId,
        });
    }
    await (0, adminRepository_1.logModerationAction)({
        adminId,
        actionType: payload.action === "FLAG"
            ? client_1.ModerationActionType.CONTENT_FLAGGED
            : payload.action === "REMOVE"
                ? client_1.ModerationActionType.CONTENT_REMOVED
                : client_1.ModerationActionType.CONTENT_RESTORED,
        targetType,
        targetId,
        reportId: payload.reportId,
        reason: payload.reason,
    });
    return {
        message: payload.action === "FLAG"
            ? "Content flagged successfully"
            : payload.action === "REMOVE"
                ? "Content removed successfully"
                : "Content restored successfully",
        item: result,
    };
};
exports.moderateContentAsAdmin = moderateContentAsAdmin;
const getAdminModerationQueue = async () => {
    return (0, adminRepository_1.getModerationQueue)();
};
exports.getAdminModerationQueue = getAdminModerationQueue;
