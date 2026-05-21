"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletTransactionSchema = void 0;
const zod_1 = require("zod");
exports.walletTransactionSchema = zod_1.z.object({
    amount: zod_1.z.number().int().positive("Amount must be a positive integer"),
    description: zod_1.z
        .string()
        .trim()
        .max(120, "Description must not exceed 120 characters")
        .optional(),
});
