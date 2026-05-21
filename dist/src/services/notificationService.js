"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readAllNotifications = exports.readNotification = exports.getUnreadNotificationsCount = exports.listNotifications = exports.notifyUser = void 0;
const notificationRepository_1 = require("../repositories/notificationRepository");
const CustomError_1 = require("../utils/CustomError");
const notifyUser = async (params) => {
    return (0, notificationRepository_1.createNotification)(params);
};
exports.notifyUser = notifyUser;
const listNotifications = async (userId) => {
    return (0, notificationRepository_1.getNotificationsForUser)(userId);
};
exports.listNotifications = listNotifications;
const getUnreadNotificationsCount = async (userId) => {
    const unreadCount = await (0, notificationRepository_1.countUnreadNotifications)(userId);
    return { unreadCount };
};
exports.getUnreadNotificationsCount = getUnreadNotificationsCount;
const readNotification = async (userId, notificationId) => {
    const notification = await (0, notificationRepository_1.findNotificationByIdForUser)(notificationId, userId);
    if (!notification) {
        throw new CustomError_1.CustomError("Notification not found", 404);
    }
    if (notification.isRead) {
        return notification;
    }
    return (0, notificationRepository_1.markNotificationAsRead)(notificationId);
};
exports.readNotification = readNotification;
const readAllNotifications = async (userId) => {
    const result = await (0, notificationRepository_1.markAllNotificationsAsRead)(userId);
    return {
        markedAsReadCount: result.count,
    };
};
exports.readAllNotifications = readAllNotifications;
