"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z.object({
    receiverId: zod_1.z.string().trim().min(1, "Receiver ID is required"),
    message: zod_1.z.string().trim().min(1, "Message is required").max(2000, "Message is too long"),
});
