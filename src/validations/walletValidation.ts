import { z } from "zod"

export const walletTransactionSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
  description: z
    .string()
    .trim()
    .max(120, "Description must not exceed 120 characters")
    .optional(),
})
