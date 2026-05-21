import { z } from "zod";

const bookingDateSchema = z
  .string()
  .datetime({ offset: true, message: "Date must be a valid ISO 8601 datetime with timezone offset" })
  .refine((value) => new Date(value) > new Date(), {
    message: "Booking date must be in the future",
  });

const meetingUrlSchema = z
  .url("Meeting link must be a valid URL")
  .refine((value) => value.startsWith("https://"), {
    message: "Meeting link must use HTTPS",
  });

export const createBookingSchema = z.object({
  skillId: z.string().trim().min(1, "Skill ID is required"),
  type: z.enum(["LEARN", "SWAP"]).default("LEARN"),
  offeredSkillId: z.string().trim().min(1, "Offered skill ID is required").optional(),
  date: bookingDateSchema,
  sessionMode: z.enum(["EXTERNAL_LINK", "IN_PERSON"]).default("EXTERNAL_LINK"),
  meetingPlatform: z.enum(["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS", "WHATSAPP", "OTHER"]).optional(),
  meetingLink: meetingUrlSchema.optional(),
  durationMinutes: z.coerce.number().int().min(15, "Duration must be at least 15 minutes").max(240, "Duration must not exceed 240 minutes"),
  sessionNotes: z.string().trim().max(500, "Session notes must not exceed 500 characters").optional(),
}).superRefine((data, ctx) => {
  if (data.type === "SWAP" && !data.offeredSkillId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["offeredSkillId"],
      message: "Offered skill ID is required for swap requests",
    });
  }

  if (data.sessionMode === "EXTERNAL_LINK" && data.meetingLink && !data.meetingPlatform) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meetingPlatform"],
      message: "Meeting platform is required when a meeting link is provided",
    });
  }

  if (data.sessionMode === "IN_PERSON" && (data.meetingLink || data.meetingPlatform)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meetingLink"],
      message: "In-person sessions should not include a meeting link or platform",
    });
  }
});

export const respondToBookingSchema = z.object({
  action: z.enum(["accept", "reject"]),
  meetingPlatform: z.enum(["GOOGLE_MEET", "ZOOM", "MICROSOFT_TEAMS", "WHATSAPP", "OTHER"]).optional(),
  meetingLink: meetingUrlSchema.optional(),
  sessionNotes: z.string().trim().max(500, "Session notes must not exceed 500 characters").optional(),
}).superRefine((data, ctx) => {
  if (data.action === "reject" && (data.meetingLink || data.meetingPlatform || data.sessionNotes)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["action"],
      message: "Meeting details can only be updated when accepting a booking",
    });
  }

  if (data.meetingLink && !data.meetingPlatform) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["meetingPlatform"],
      message: "Meeting platform is required when a meeting link is provided",
    });
  }
});

export const requestBookingExtensionSchema = z.object({
  extraMinutes: z.coerce.number().int().min(15, "Extension must be at least 15 minutes").max(180, "Extension must not exceed 180 minutes"),
  extraCreditCost: z.coerce.number().int().min(0, "Extra credit cost must be zero or greater").optional(),
}).superRefine((data, ctx) => {
  if (data.extraCreditCost !== undefined && data.extraCreditCost % 2 !== 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["extraCreditCost"],
      message: "Extra credit cost must be an even number so it can be split fairly for swap sessions",
    });
  }
});

export const respondToBookingExtensionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300, "Reason must not exceed 300 characters").optional(),
});

export const reportBookingOutcomeSchema = z.object({
  outcome: z.enum(["REQUESTER_NO_SHOW", "PROVIDER_NO_SHOW", "BOTH_NO_SHOW"]),
});
