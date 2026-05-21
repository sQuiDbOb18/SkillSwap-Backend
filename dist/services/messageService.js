"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markPendingMessagesAsDelivered = exports.getUnreadMessagesCount = exports.markConversationAsRead = exports.listUserConversations = exports.getChatHistory = exports.sendDirectMessage = exports.formatMessageForUser = void 0;
const messageRepository_1 = require("../repositories/messageRepository");
const userRepository_1 = require("../repositories/userRepository");
const CustomError_1 = require("../utils/CustomError");
const getDeliveryStatus = (message) => {
    if (message.readAt) {
        return "read";
    }
    if (message.deliveredAt) {
        return "delivered";
    }
    return "sent";
};
const formatMessageForUser = (currentUserId, message) => ({
    ...message,
    isOwnMessage: message.senderId === currentUserId,
    deliveryStatus: message.senderId === currentUserId ? getDeliveryStatus(message) : null,
});
exports.formatMessageForUser = formatMessageForUser;
const sendDirectMessage = async (senderId, receiverId, message, options) => {
    if (senderId === receiverId) {
        throw new CustomError_1.CustomError("You cannot send a message to yourself", 400);
    }
    const receiver = await (0, userRepository_1.findUserById)(receiverId);
    if (!receiver) {
        throw new CustomError_1.CustomError("Receiver not found", 404);
    }
    return (0, messageRepository_1.createMessage)({
        senderId,
        receiverId,
        message: message.trim(),
        deliveredAt: (options === null || options === void 0 ? void 0 : options.recipientOnline) ? new Date() : undefined,
    });
};
exports.sendDirectMessage = sendDirectMessage;
const getChatHistory = async (currentUserId, otherUserId) => {
    if (!(otherUserId === null || otherUserId === void 0 ? void 0 : otherUserId.trim())) {
        throw new CustomError_1.CustomError("User ID is required", 400);
    }
    const otherUser = await (0, userRepository_1.findUserById)(otherUserId);
    if (!otherUser) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const { count } = await (0, messageRepository_1.markConversationMessagesAsRead)(currentUserId, otherUserId);
    const messages = (await (0, messageRepository_1.getConversation)(currentUserId, otherUserId)).map((message) => (0, exports.formatMessageForUser)(currentUserId, message));
    return {
        messages,
        markedAsReadCount: count,
    };
};
exports.getChatHistory = getChatHistory;
const listUserConversations = async (currentUserId) => {
    var _a;
    const messages = await (0, messageRepository_1.getMessagesForUser)(currentUserId);
    const seenUsers = new Set();
    const unreadCounts = new Map();
    for (const message of messages) {
        if (message.receiverId === currentUserId && !message.readAt) {
            unreadCounts.set(message.senderId, ((_a = unreadCounts.get(message.senderId)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
    }
    return messages.reduce((conversations, message) => {
        var _a;
        const otherUser = message.senderId === currentUserId ? message.receiver : message.sender;
        if (seenUsers.has(otherUser.id)) {
            return conversations;
        }
        seenUsers.add(otherUser.id);
        conversations.push({
            user: otherUser,
            lastMessage: (0, exports.formatMessageForUser)(currentUserId, message),
            unreadCount: (_a = unreadCounts.get(otherUser.id)) !== null && _a !== void 0 ? _a : 0,
        });
        return conversations;
    }, []);
};
exports.listUserConversations = listUserConversations;
const markConversationAsRead = async (currentUserId, otherUserId) => {
    if (!(otherUserId === null || otherUserId === void 0 ? void 0 : otherUserId.trim())) {
        throw new CustomError_1.CustomError("User ID is required", 400);
    }
    const otherUser = await (0, userRepository_1.findUserById)(otherUserId);
    if (!otherUser) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const { count } = await (0, messageRepository_1.markConversationMessagesAsRead)(currentUserId, otherUserId);
    return {
        userId: otherUserId,
        unreadCount: 0,
        markedAsReadCount: count,
    };
};
exports.markConversationAsRead = markConversationAsRead;
const getUnreadMessagesCount = async (currentUserId) => {
    const unreadCount = await (0, messageRepository_1.countUnreadMessages)(currentUserId);
    return {
        unreadCount,
    };
};
exports.getUnreadMessagesCount = getUnreadMessagesCount;
const markPendingMessagesAsDelivered = async (currentUserId) => {
    const messages = await (0, messageRepository_1.getUndeliveredMessages)(currentUserId);
    if (messages.length === 0) {
        return [];
    }
    await (0, messageRepository_1.markMessagesAsDelivered)(messages.map((message) => message.id));
    return messages.map((message) => (0, exports.formatMessageForUser)(message.senderId, {
        ...message,
        deliveredAt: new Date(),
    }));
};
exports.markPendingMessagesAsDelivered = markPendingMessagesAsDelivered;
