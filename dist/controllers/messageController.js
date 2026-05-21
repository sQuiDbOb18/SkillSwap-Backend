"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUnreadCountController = exports.markConversationAsReadController = exports.listConversationsController = exports.getChatHistoryController = exports.sendMessageController = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const messageService_1 = require("../services/messageService");
const chatSocket_1 = require("../socket/chatSocket");
exports.sendMessageController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const message = await (0, messageService_1.sendDirectMessage)(req.user.userId, req.body.receiverId, req.body.message, {
        recipientOnline: (0, chatSocket_1.isUserOnline)(req.body.receiverId),
    });
    (0, chatSocket_1.emitChatMessage)(message);
    res.status(201).json((0, messageService_1.formatMessageForUser)(req.user.userId, message));
});
exports.getChatHistoryController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, messageService_1.getChatHistory)(req.user.userId, req.params.userId);
    if (result.markedAsReadCount > 0) {
        (0, chatSocket_1.emitConversationRead)(req.user.userId, req.params.userId);
    }
    res.json(result);
});
exports.listConversationsController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const conversations = await (0, messageService_1.listUserConversations)(req.user.userId);
    res.json(conversations.map((conversation) => {
        var _a;
        return ({
            ...conversation,
            isOnline: (0, chatSocket_1.isUserOnline)(conversation.user.id),
            lastSeenAt: (0, chatSocket_1.isUserOnline)(conversation.user.id) ? null : (_a = conversation.user.lastSeenAt) !== null && _a !== void 0 ? _a : null,
        });
    }));
});
exports.markConversationAsReadController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, messageService_1.markConversationAsRead)(req.user.userId, req.params.userId);
    if (result.markedAsReadCount > 0) {
        (0, chatSocket_1.emitConversationRead)(req.user.userId, req.params.userId);
    }
    res.json(result);
});
exports.getUnreadCountController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, messageService_1.getUnreadMessagesCount)(req.user.userId);
    res.json(result);
});
