"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToBookingSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
const bookingDateSchema = zod_1.z
    .string()
    .datetime({ offset: true, message: "Date must be a valid ISO 8601 datetime with timezone offset" })
    .refine((value) => new Date(value) > new Date(), {
    message: "Booking date must be in the future",
});
exports.createBookingSchema = zod_1.z.object({
    skillId: zod_1.z.string().trim().min(1, "Skill ID is required"),
    type: zod_1.z.enum(["LEARN", "SWAP"]).default("LEARN"),
    offeredSkillId: zod_1.z.string().trim().min(1, "Offered skill ID is required").optional(),
    date: bookingDateSchema,
}).superRefine((data, ctx) => {
    if (data.type === "SWAP" && !data.offeredSkillId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["offeredSkillId"],
            message: "Offered skill ID is required for swap requests",
        });
    }
});
exports.respondToBookingSchema = zod_1.z.object({
    action: zod_1.z.enum(["accept", "reject"]),
});
