"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsReadController = exports.markNotificationAsReadController = exports.getUnreadNotificationCountController = exports.getNotificationsController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const notificationService_1 = require("../services/notificationService");
exports.getNotificationsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notifications = await (0, notificationService_1.listNotifications)(req.user.userId);
    res.json(notifications);
});
exports.getUnreadNotificationCountController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, notificationService_1.getUnreadNotificationsCount)(req.user.userId);
    res.json(result);
});
exports.markNotificationAsReadController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notification = await (0, notificationService_1.readNotification)(req.user.userId, req.params.notificationId);
    res.json(notification);
});
exports.markAllNotificationsAsReadController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, notificationService_1.readAllNotifications)(req.user.userId);
    res.json(result);
});
