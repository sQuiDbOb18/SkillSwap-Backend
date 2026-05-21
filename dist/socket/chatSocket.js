"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserOnline = exports.emitPresence = exports.emitConversationRead = exports.emitMessageDelivered = exports.emitChatMessage = exports.initializeSocketServer = void 0;
const socket_io_1 = require("socket.io");
const userRepository_1 = require("../repositories/userRepository");
const messageService_1 = require("../services/messageService");
const authToken_1 = require("../utils/authToken");
let io = null;
const onlineUsers = new Map();
const getUserRoom = (userId) => `user:${userId}`;
const incrementOnlineUser = (userId) => {
    var _a;
    onlineUsers.set(userId, ((_a = onlineUsers.get(userId)) !== null && _a !== void 0 ? _a : 0) + 1);
};
const decrementOnlineUser = (userId) => {
    var _a;
    const nextCount = ((_a = onlineUsers.get(userId)) !== null && _a !== void 0 ? _a : 1) - 1;
    if (nextCount <= 0) {
        onlineUsers.delete(userId);
        return;
    }
    onlineUsers.set(userId, nextCount);
};
const extractSocketToken = (socket) => {
    var _a, _b;
    const authToken = (_a = socket.handshake.auth) === null || _a === void 0 ? void 0 : _a.token;
    if (typeof authToken === "string" && authToken.trim()) {
        return authToken;
    }
    const header = (_b = socket.handshake.headers) === null || _b === void 0 ? void 0 : _b.authorization;
    if (typeof header === "string" && header.startsWith("Bearer ")) {
        return header.slice(7);
    }
    return null;
};
const initializeSocketServer = (server) => {
    var _a, _b;
    io = new socket_io_1.Server(server, {
        cors: {
            origin: (_b = (_a = process.env.CLIENT_URL) === null || _a === void 0 ? void 0 : _a.split(",")) !== null && _b !== void 0 ? _b : "*",
            methods: ["GET", "POST"],
        },
    });
    io.use(async (socket, next) => {
        try {
            const token = extractSocketToken(socket);
            if (!token) {
                return next(new Error("Authentication token is required"));
            }
            const decoded = (0, authToken_1.verifyAccessToken)(token);
            const user = await (0, userRepository_1.findUserForAuthById)(decoded.userId);
            if (!user || user.deletedAt || decoded.tokenVersion !== user.tokenVersion) {
                return next(new Error("Unauthorized"));
            }
            socket.data.user = {
                userId: user.id,
            };
            next();
        }
        catch (error) {
            next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        const currentUserId = socket.data.user.userId;
        incrementOnlineUser(currentUserId);
        socket.join(getUserRoom(currentUserId));
        (0, exports.emitPresence)(currentUserId, true);
        void (async () => {
            const deliveredMessages = await (0, messageService_1.markPendingMessagesAsDelivered)(currentUserId);
            deliveredMessages.forEach((message) => (0, exports.emitMessageDelivered)(message));
        })();
        socket.on("chat:send", async (payload, callback) => {
            var _a;
            try {
                const createdMessage = await (0, messageService_1.sendDirectMessage)(currentUserId, payload === null || payload === void 0 ? void 0 : payload.receiverId, payload === null || payload === void 0 ? void 0 : payload.message, {
                    recipientOnline: (0, exports.isUserOnline)(payload === null || payload === void 0 ? void 0 : payload.receiverId),
                });
                (0, exports.emitChatMessage)(createdMessage);
                if (typeof callback === "function") {
                    callback({ success: true, data: (0, messageService_1.formatMessageForUser)(currentUserId, createdMessage) });
                }
            }
            catch (error) {
                if (typeof callback === "function") {
                    callback({
                        success: false,
                        message: (_a = error.message) !== null && _a !== void 0 ? _a : "Failed to send message",
                    });
                }
            }
        });
        socket.on("chat:read", async (payload, callback) => {
            var _a;
            try {
                const result = await (0, messageService_1.markConversationAsRead)(currentUserId, payload === null || payload === void 0 ? void 0 : payload.userId);
                if (result.markedAsReadCount > 0) {
                    (0, exports.emitConversationRead)(currentUserId, payload === null || payload === void 0 ? void 0 : payload.userId);
                }
                if (typeof callback === "function") {
                    callback({ success: true, data: result });
                }
            }
            catch (error) {
                if (typeof callback === "function") {
                    callback({
                        success: false,
                        message: (_a = error.message) !== null && _a !== void 0 ? _a : "Failed to mark conversation as read",
                    });
                }
            }
        });
        socket.on("disconnect", () => {
            decrementOnlineUser(currentUserId);
            if (!(0, exports.isUserOnline)(currentUserId)) {
                const lastSeenAt = new Date();
                void (0, userRepository_1.updateUserLastSeen)(currentUserId, lastSeenAt);
                (0, exports.emitPresence)(currentUserId, false, lastSeenAt);
            }
        });
    });
    return io;
};
exports.initializeSocketServer = initializeSocketServer;
const emitChatMessage = (message) => {
    if (!io) {
        return;
    }
    io.to(getUserRoom(message.senderId)).emit("chat:message", (0, messageService_1.formatMessageForUser)(message.senderId, message));
    io.to(getUserRoom(message.receiverId)).emit("chat:message", (0, messageService_1.formatMessageForUser)(message.receiverId, message));
};
exports.emitChatMessage = emitChatMessage;
const emitMessageDelivered = (message) => {
    var _a;
    if (!io) {
        return;
    }
    io.to(getUserRoom(message.senderId)).to(getUserRoom(message.receiverId)).emit("chat:delivered", {
        messageId: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        deliveredAt: (_a = message.deliveredAt) !== null && _a !== void 0 ? _a : new Date(),
    });
};
exports.emitMessageDelivered = emitMessageDelivered;
const emitConversationRead = (readerUserId, otherUserId) => {
    if (!io) {
        return;
    }
    io.to(getUserRoom(readerUserId)).to(getUserRoom(otherUserId)).emit("chat:read", {
        userId: otherUserId,
        readByUserId: readerUserId,
    });
};
exports.emitConversationRead = emitConversationRead;
const emitPresence = (userId, isOnline, lastSeenAt) => {
    if (!io) {
        return;
    }
    io.emit("presence:update", {
        userId,
        isOnline,
        lastSeenAt: isOnline ? null : (lastSeenAt !== null && lastSeenAt !== void 0 ? lastSeenAt : null),
    });
};
exports.emitPresence = emitPresence;
const isUserOnline = (userId) => {
    if (!userId) {
        return false;
    }
    return onlineUsers.has(userId);
};
exports.isUserOnline = isUserOnline;
