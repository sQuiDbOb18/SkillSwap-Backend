"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.findNotificationByIdForUser = exports.countUnreadNotifications = exports.getNotificationsForUser = exports.createNotification = void 0;
const db_1 = __importDefault(require("../config/db"));
const prismaClient = db_1.default;
const notificationSelect = {
    id: true,
    userId: true,
    type: true,
    message: true,
    isRead: true,
    relatedBookingId: true,
    relatedMessageId: true,
    createdAt: true,
    updatedAt: true,
};
const createNotification = (data) => {
    return prismaClient.notification.create({
        data,
        select: notificationSelect,
    });
};
exports.createNotification = createNotification;
const getNotificationsForUser = (userId) => {
    return prismaClient.notification.findMany({
        where: { userId },
        select: notificationSelect,
        orderBy: { createdAt: "desc" },
    });
};
exports.getNotificationsForUser = getNotificationsForUser;
const countUnreadNotifications = (userId) => {
    return prismaClient.notification.count({
        where: {
            userId,
            isRead: false,
        },
    });
};
exports.countUnreadNotifications = countUnreadNotifications;
const findNotificationByIdForUser = (id, userId) => {
    return prismaClient.notification.findFirst({
        where: {
            id,
            userId,
        },
        select: notificationSelect,
    });
};
exports.findNotificationByIdForUser = findNotificationByIdForUser;
const markNotificationAsRead = (id) => {
    return prismaClient.notification.update({
        where: { id },
        data: {
            isRead: true,
        },
        select: notificationSelect,
    });
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = (userId) => {
    return prismaClient.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
