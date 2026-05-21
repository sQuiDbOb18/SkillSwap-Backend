"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    bookingId: zod_1.z.string().trim().min(1, "Booking ID is required"),
    rating: zod_1.z
        .number({ message: "Rating is required" })
        .int("Rating must be a whole number")
        .min(1, "Rating must be at least 1")
        .max(5, "Rating must be at most 5"),
    comment: zod_1.z
        .string()
        .trim()
        .max(1000, "Comment is too long")
        .optional(),
});
