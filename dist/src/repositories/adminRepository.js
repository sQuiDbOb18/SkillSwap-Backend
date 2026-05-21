"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModerationQueue = exports.updateReviewModeration = exports.findReviewForModeration = exports.updateSkillModeration = exports.findSkillForModeration = exports.logModerationAction = exports.updateReportById = exports.findReportById = exports.getReportsForAdmin = exports.findOpenReportByReporterAndTarget = exports.createReportRecord = exports.findUserForAdminById = exports.getUsersForAdmin = exports.getAdminDashboardCounts = void 0;
const client_1 = require("@prisma/client");
const db_1 = __importDefault(require("../config/db"));
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
};
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
};
const getAdminDashboardCounts = async () => {
    const [totalUsers, activeUsers, deletedUsers, openReports, flaggedSkills, removedSkills, flaggedReviews, removedReviews,] = await Promise.all([
        db_1.default.user.count(),
        db_1.default.user.count({ where: { deletedAt: null } }),
        db_1.default.user.count({ where: { deletedAt: { not: null } } }),
        db_1.default.report.count({ where: { status: { in: [client_1.ReportStatus.OPEN, client_1.ReportStatus.UNDER_REVIEW] } } }),
        db_1.default.skill.count({ where: { moderationStatus: client_1.ModerationStatus.FLAGGED } }),
        db_1.default.skill.count({ where: { moderationStatus: client_1.ModerationStatus.REMOVED } }),
        db_1.default.review.count({ where: { moderationStatus: client_1.ModerationStatus.FLAGGED } }),
        db_1.default.review.count({ where: { moderationStatus: client_1.ModerationStatus.REMOVED } }),
    ]);
    return {
        users: { total: totalUsers, active: activeUsers, deleted: deletedUsers },
        reports: { open: openReports },
        moderation: {
            flaggedSkills,
            removedSkills,
            flaggedReviews,
            removedReviews,
        },
    };
};
exports.getAdminDashboardCounts = getAdminDashboardCounts;
const getUsersForAdmin = async (params) => {
    const where = {
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
    };
    const [items, total] = await Promise.all([
        db_1.default.user.findMany({
            where,
            select: adminUserSelect,
            orderBy: { createdAt: "desc" },
            skip: params.skip,
            take: params.take,
        }),
        db_1.default.user.count({ where }),
    ]);
    return { items, total };
};
exports.getUsersForAdmin = getUsersForAdmin;
const findUserForAdminById = (userId) => {
    return db_1.default.user.findUnique({
        where: { id: userId },
        select: adminUserSelect,
    });
};
exports.findUserForAdminById = findUserForAdminById;
const createReportRecord = (data) => {
    return db_1.default.report.create({
        data: {
            reporterId: data.reporterId,
            targetType: data.targetType,
            targetId: data.targetId,
            targetUserId: data.targetUserId,
            reason: data.reason,
            details: data.details,
        },
        include: reportInclude,
    });
};
exports.createReportRecord = createReportRecord;
const findOpenReportByReporterAndTarget = (data) => {
    return db_1.default.report.findFirst({
        where: {
            reporterId: data.reporterId,
            targetType: data.targetType,
            targetId: data.targetId,
            status: { in: [client_1.ReportStatus.OPEN, client_1.ReportStatus.UNDER_REVIEW] },
        },
    });
};
exports.findOpenReportByReporterAndTarget = findOpenReportByReporterAndTarget;
const getReportsForAdmin = async (params) => {
    const where = {
        ...(params.status ? { status: params.status } : {}),
        ...(params.targetType ? { targetType: params.targetType } : {}),
    };
    const [items, total] = await Promise.all([
        db_1.default.report.findMany({
            where,
            include: reportInclude,
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
            skip: params.skip,
            take: params.take,
        }),
        db_1.default.report.count({ where }),
    ]);
    return { items, total };
};
exports.getReportsForAdmin = getReportsForAdmin;
const findReportById = (reportId) => {
    return db_1.default.report.findUnique({
        where: { id: reportId },
        include: reportInclude,
    });
};
exports.findReportById = findReportById;
const updateReportById = (reportId, data) => {
    return db_1.default.report.update({
        where: { id: reportId },
        data,
        include: reportInclude,
    });
};
exports.updateReportById = updateReportById;
const logModerationAction = (data) => {
    return db_1.default.moderationLog.create({
        data,
    });
};
exports.logModerationAction = logModerationAction;
const findSkillForModeration = (skillId) => {
    return db_1.default.skill.findUnique({
        where: { id: skillId },
        select: {
            id: true,
            userId: true,
            title: true,
            moderationStatus: true,
            moderationReason: true,
            moderatedAt: true,
        },
    });
};
exports.findSkillForModeration = findSkillForModeration;
const updateSkillModeration = (skillId, data) => {
    return db_1.default.skill.update({
        where: { id: skillId },
        data,
    });
};
exports.updateSkillModeration = updateSkillModeration;
const findReviewForModeration = (reviewId) => {
    return db_1.default.review.findUnique({
        where: { id: reviewId },
        select: {
            id: true,
            userId: true,
            targetUserId: true,
            moderationStatus: true,
            moderationReason: true,
            moderatedAt: true,
        },
    });
};
exports.findReviewForModeration = findReviewForModeration;
const updateReviewModeration = (reviewId, data) => {
    return db_1.default.review.update({
        where: { id: reviewId },
        data,
    });
};
exports.updateReviewModeration = updateReviewModeration;
const getModerationQueue = async () => {
    const [flaggedSkills, flaggedReviews, openReports] = await Promise.all([
        db_1.default.skill.findMany({
            where: { moderationStatus: client_1.ModerationStatus.FLAGGED },
            orderBy: { updatedAt: "desc" },
            take: 20,
        }),
        db_1.default.review.findMany({
            where: { moderationStatus: client_1.ModerationStatus.FLAGGED },
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
        db_1.default.report.findMany({
            where: {
                status: {
                    in: [client_1.ReportStatus.OPEN, client_1.ReportStatus.UNDER_REVIEW],
                },
            },
            include: reportInclude,
            orderBy: { createdAt: "desc" },
            take: 20,
        }),
    ]);
    return {
        flaggedSkills,
        flaggedReviews,
        openReports,
    };
};
exports.getModerationQueue = getModerationQueue;
