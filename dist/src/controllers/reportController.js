"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReportController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const adminService_1 = require("../services/adminService");
exports.createReportController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const report = await (0, adminService_1.createReport)(req.user.userId, req.body);
    res.status(201).json(report);
});
