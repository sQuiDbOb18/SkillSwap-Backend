"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.discoverSkillsQuerySchema = exports.updateSkillSchema = exports.createSkillSchema = void 0;
const zod_1 = require("zod");
const skill_1 = require("../types/skill");
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const availabilitySlotSchema = zod_1.z
    .object({
    day: zod_1.z.enum(skill_1.availabilityDays),
    startTime: zod_1.z.string().regex(timeRegex, "Start time must be in HH:MM format"),
    endTime: zod_1.z.string().regex(timeRegex, "End time must be in HH:MM format"),
})
    .refine((data) => data.startTime < data.endTime, {
    message: "End time must be later than start time",
    path: ["endTime"],
});
const skillFieldSchemas = {
    title: zod_1.z
        .string()
        .trim()
        .min(2, "Title must be at least 2 characters")
        .max(80, "Title must not exceed 80 characters"),
    description: zod_1.z
        .string()
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(500, "Description must not exceed 500 characters"),
    category: zod_1.z.enum(skill_1.skillCategories),
    level: zod_1.z.enum(skill_1.skillLevels),
    tags: zod_1.z
        .array(zod_1.z
        .string()
        .trim()
        .min(1, "Tags cannot be empty")
        .max(30, "Tags must not exceed 30 characters"))
        .max(10, "Tags must not exceed 10 items")
        .optional(),
    availability: zod_1.z
        .array(availabilitySlotSchema)
        .max(21, "Availability must not exceed 21 time slots")
        .optional(),
    price: zod_1.z.number().nonnegative("Price must be zero or greater").nullable().optional(),
    creditCost: zod_1.z.number().int().nonnegative("Credit cost must be zero or greater").nullable().optional(),
    isBarter: zod_1.z.boolean().optional(),
};
exports.createSkillSchema = zod_1.z.object(skillFieldSchemas).superRefine((data, ctx) => {
    if (!data.isBarter && (data.creditCost === undefined || data.creditCost === null)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["creditCost"],
            message: "Credit cost is required for non-barter skills",
        });
    }
});
exports.updateSkillSchema = zod_1.z
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
exports.discoverSkillsQuerySchema = zod_1.z.object({
    search: zod_1.z.string().trim().min(1).optional(),
    category: zod_1.z.enum(skill_1.skillCategories).optional(),
    minRating: zod_1.z.coerce.number().min(0).max(5).optional(),
    availabilityDay: zod_1.z.enum(skill_1.availabilityDays).optional(),
    level: zod_1.z.enum(skill_1.skillLevels).optional(),
    tag: zod_1.z.string().trim().min(1).max(30).optional(),
    isBarter: zod_1.z.coerce.boolean().optional(),
    minCreditCost: zod_1.z.coerce.number().int().min(0).optional(),
    maxCreditCost: zod_1.z.coerce.number().int().min(0).optional(),
    sortBy: zod_1.z.enum(["newest", "rating", "creditCostAsc", "creditCostDesc"]).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional(),
}).refine((data) => {
    if (data.minCreditCost === undefined || data.maxCreditCost === undefined) {
        return true;
    }
    return data.minCreditCost <= data.maxCreditCost;
}, {
    message: "Minimum credit cost cannot be greater than maximum credit cost",
    path: ["minCreditCost"],
});
