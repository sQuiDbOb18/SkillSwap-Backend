import { z } from "zod";
import { availabilityDays, skillCategories, skillLevels } from "../types/skill";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const booleanQuerySchema = z.union([
  z.boolean(),
  z.enum(["true", "false"]).transform((value) => value === "true"),
]);

const availabilitySlotSchema = z
  .object({
    day: z.enum(availabilityDays),
    startTime: z.string().regex(timeRegex, "Start time must be in HH:MM format"),
    endTime: z.string().regex(timeRegex, "End time must be in HH:MM format"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be later than start time",
    path: ["endTime"],
  });

const skillFieldSchemas = {
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(80, "Title must not exceed 80 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters"),
  category: z.enum(skillCategories),
  level: z.enum(skillLevels),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tags cannot be empty")
        .max(30, "Tags must not exceed 30 characters")
    )
    .max(10, "Tags must not exceed 10 items")
    .optional(),
  availability: z
    .array(availabilitySlotSchema)
    .max(21, "Availability must not exceed 21 time slots")
    .optional(),
  price: z.number().nonnegative("Price must be zero or greater").nullable().optional(),
  creditCost: z.number().int().nonnegative("Credit cost must be zero or greater").nullable().optional(),
  isBarter: z.boolean().optional(),
};

export const createSkillSchema = z.object(skillFieldSchemas).superRefine((data, ctx) => {
  if (!data.isBarter && (data.creditCost === undefined || data.creditCost === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["creditCost"],
      message: "Credit cost is required for non-barter skills",
    });
  }
});

export const updateSkillSchema = z
  .object({
    title: skillFieldSchemas.title.optional(),
    description: skillFieldSchemas.description.optional(),
    category: skillFieldSchemas.category.optional(),
    level: skillFieldSchemas.level.optional(),
    tags: skillFieldSchemas.tags,
    availability: skillFieldSchemas.availability,
    price: skillFieldSchemas.price,
    creditCost: skillFieldSchemas.creditCost,
    isBarter: skillFieldSchemas.isBarter,
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update",
    path: ["title"],
  });

export const discoverSkillsQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: z.enum(skillCategories).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  availabilityDay: z.enum(availabilityDays).optional(),
  level: z.enum(skillLevels).optional(),
  tag: z.string().trim().min(1).max(30).optional(),
  isBarter: booleanQuerySchema.optional(),
  minCreditCost: z.coerce.number().int().min(0).optional(),
  maxCreditCost: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(["newest", "rating", "creditCostAsc", "creditCostDesc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
}).refine((data) => {
  if (data.minCreditCost === undefined || data.maxCreditCost === undefined) {
    return true;
  }

  return data.minCreditCost <= data.maxCreditCost;
}, {
  message: "Minimum credit cost cannot be greater than maximum credit cost",
  path: ["minCreditCost"],
});

export const saveSkillSearchSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Saved search name must be at least 2 characters")
    .max(60, "Saved search name must not exceed 60 characters"),
  query: discoverSkillsQuerySchema,
});
