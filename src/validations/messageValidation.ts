import { z } from "zod"

export const sendMessageSchema = z.object({
  receiverId: z.string().trim().min(1, "Receiver ID is required"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message is too long"),
})
