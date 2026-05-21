"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportBookingOutcomeSchema = exports.cancelBookingSchema = exports.respondToBookingExtensionSchema = exports.requestBookingExtensionSchema = exports.respondToBookingSchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
const bookingDateSchema = zod_1.z
    .string()
    .datetime({ offset: true, message: "Date must be a valid ISO 8601 datetime with timezone offset" })
    .refine((value) => new Date(value) > new Date(), {
    message: "Booking date must be in the future",
});
const meetingUrlSchema = zod_1.z
    .url("Meeting link must be a valid URL")
    .refine((value) => value.startsWith("https://"), {
    message: "Meeting link must use HTTPS",
});
exports.createBookingSchema = zod_1.z.object({
    skillId: zod_1.z.string().trim().min(1, "Skill ID is required"),
    type: zod_1.z.enum(["LEARN", "SWAP"]).default("LEARN"),
    offeredSkillId: zod_1.z.string().trim().min(1, "Offered skill ID is required").optional(),
    date: bookingDateSchema,
    sessionMode: zod_1.z.enum(["EXTERNAL_LINK", "IN_PERSON"]).default("EXTERNAL_LINK"),
    meetingPlatform: zod_1.z.enum(["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS", "WHATSAPP", "OTHER"]).optional(),
    meetingLink: meetingUrlSchema.optional(),
    durationMinutes: zod_1.z.coerce.number().int().min(15, "Duration must be at least 15 minutes").max(240, "Duration must not exceed 240 minutes"),
    sessionNotes: zod_1.z.string().trim().max(500, "Session notes must not exceed 500 characters").optional(),
}).superRefine((data, ctx) => {
    if (data.type === "SWAP" && !data.offeredSkillId) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["offeredSkillId"],
            message: "Offered skill ID is required for swap requests",
        });
    }
    if (data.sessionMode === "EXTERNAL_LINK" && data.meetingLink && !data.meetingPlatform) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["meetingPlatform"],
            message: "Meeting platform is required when a meeting link is provided",
        });
    }
    if (data.sessionMode === "IN_PERSON" && (data.meetingLink || data.meetingPlatform)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["meetingLink"],
            message: "In-person sessions should not include a meeting link or platform",
        });
    }
});
exports.respondToBookingSchema = zod_1.z.object({
    action: zod_1.z.enum(["accept", "reject"]),
    meetingPlatform: zod_1.z.enum(["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS", "WHATSAPP", "OTHER"]).optional(),
    meetingLink: meetingUrlSchema.optional(),
    sessionNotes: zod_1.z.string().trim().max(500, "Session notes must not exceed 500 characters").optional(),
}).superRefine((data, ctx) => {
    if (data.action === "reject" && (data.meetingLink || data.meetingPlatform || data.sessionNotes)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["action"],
            message: "Meeting details can only be updated when accepting a booking",
        });
    }
    if (data.meetingLink && !data.meetingPlatform) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["meetingPlatform"],
            message: "Meeting platform is required when a meeting link is provided",
        });
    }
});
exports.requestBookingExtensionSchema = zod_1.z.object({
    extraMinutes: zod_1.z.coerce.number().int().min(15, "Extension must be at least 15 minutes").max(180, "Extension must not exceed 180 minutes"),
    extraCreditCost: zod_1.z.coerce.number().int().min(0, "Extra credit cost must be zero or greater").optional(),
}).superRefine((data, ctx) => {
    if (data.extraCreditCost !== undefined && data.extraCreditCost % 2 !== 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["extraCreditCost"],
            message: "Extra credit cost must be an even number so it can be split fairly for swap sessions",
        });
    }
});
exports.respondToBookingExtensionSchema = zod_1.z.object({
    action: zod_1.z.enum(["approve", "reject"]),
});
exports.cancelBookingSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().max(300, "Reason must not exceed 300 characters").optional(),
});
exports.reportBookingOutcomeSchema = zod_1.z.object({
    outcome: zod_1.z.enum(["REQUESTER_NO_SHOW", "PROVIDER_NO_SHOW", "BOTH_NO_SHOW"]),
});
