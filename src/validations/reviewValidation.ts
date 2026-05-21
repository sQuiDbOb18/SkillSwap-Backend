import { z } from "zod"

export const createReviewSchema = z.object({
  bookingId: z.string().trim().min(1, "Booking ID is required"),
  rating: z
    .number({ message: "Rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment is too long")
    .optional(),
})
