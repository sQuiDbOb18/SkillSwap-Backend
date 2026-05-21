"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessagesAsDelivered = exports.getUndeliveredMessages = exports.countUnreadMessages = exports.markConversationMessagesAsRead = exports.getMessagesForUser = exports.getConversation = exports.createMessage = void 0;
const db_1 = __importDefault(require("../config/db"));
const messageInclude = {
    sender: {
        select: {
            id: true,
            username: true,
            fullName: true,
            lastSeenAt: true,
        },
    },
    receiver: {
        select: {
            id: true,
            username: true,
            fullName: true,
            lastSeenAt: true,
        },
    },
};
const createMessage = (data) => {
    return db_1.default.message.create({
        data,
        include: messageInclude,
    });
};
exports.createMessage = createMessage;
const getConversation = (userId, otherUserId) => {
    return db_1.default.message.findMany({
        where: {
            OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
            ],
        },
        include: messageInclude,
        orderBy: { createdAt: "asc" },
    });
};
exports.getConversation = getConversation;
const getMessagesForUser = (userId) => {
    return db_1.default.message.findMany({
        where: {
            OR: [{ senderId: userId }, { receiverId: userId }],
        },
        include: messageInclude,
        orderBy: { createdAt: "desc" },
    });
};
exports.getMessagesForUser = getMessagesForUser;
const markConversationMessagesAsRead = (receiverId, senderId) => {
    return db_1.default.message.updateMany({
        where: {
            receiverId,
            senderId,
            readAt: null,
        },
        data: {
            readAt: new Date(),
        },
    });
};
exports.markConversationMessagesAsRead = markConversationMessagesAsRead;
const countUnreadMessages = (receiverId) => {
    return db_1.default.message.count({
        where: {
            receiverId,
            readAt: null,
        },
    });
};
exports.countUnreadMessages = countUnreadMessages;
const getUndeliveredMessages = (receiverId) => {
    const where = {
        receiverId,
        deliveredAt: null,
    };
    return db_1.default.message.findMany({
        where,
        include: messageInclude,
        orderBy: { createdAt: "asc" },
    });
};
exports.getUndeliveredMessages = getUndeliveredMessages;
const markMessagesAsDelivered = (messageIds) => {
    if (messageIds.length === 0) {
        return Promise.resolve({ count: 0 });
    }
    const where = {
        id: {
            in: messageIds,
        },
        deliveredAt: null,
    };
    const data = {
        deliveredAt: new Date(),
    };
    return db_1.default.message.updateMany({
        where,
        data,
    });
};
exports.markMessagesAsDelivered = markMessagesAsDelivered;
