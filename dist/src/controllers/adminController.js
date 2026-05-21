"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModerationQueueController = exports.moderateContentController = exports.updateReportStatusController = exports.getAllReportsController = exports.deleteUserByAdminController = exports.getAllUsersController = exports.getAdminDashboardController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const adminService_1 = require("../services/adminService");
const adminValidation_1 = require("../validations/adminValidation");
exports.getAdminDashboardController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, adminService_1.getAdminDashboard)();
    res.json(result);
});
exports.getAllUsersController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const query = adminValidation_1.adminUsersQuerySchema.parse(req.query);
    const result = await (0, adminService_1.getAllUsersForAdmin)(query);
    res.json(result);
});
exports.deleteUserByAdminController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, adminService_1.deleteUserAsAdmin)(req.user.userId, req.params.userId, req.body.reason);
    res.json(result);
});
exports.getAllReportsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const query = adminValidation_1.adminReportsQuerySchema.parse(req.query);
    const result = await (0, adminService_1.getAllReportsForAdmin)(query);
    res.json(result);
});
exports.updateReportStatusController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, adminService_1.updateReportStatusAsAdmin)(req.user.userId, req.params.reportId, req.body);
    res.json(result);
});
exports.moderateContentController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const params = adminValidation_1.moderationTargetParamsSchema.parse(req.params);
    const result = await (0, adminService_1.moderateContentAsAdmin)(req.user.userId, params.targetType, params.targetId, req.body);
    res.json(result);
});
exports.getModerationQueueController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, adminService_1.getAdminModerationQueue)();
    res.json(result);
});
