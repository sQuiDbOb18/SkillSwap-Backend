"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSkillSchema = exports.createSkillSchema = void 0;
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
    isBarter: zod_1.z.boolean().optional(),
};
exports.createSkillSchema = zod_1.z.object(skillFieldSchemas);
exports.updateSkillSchema = zod_1.z
    .object({
    title: skillFieldSchemas.title.optional(),
    description: skillFieldSchemas.description.optional(),
    category: skillFieldSchemas.category.optional(),
    level: skillFieldSchemas.level.optional(),
    tags: skillFieldSchemas.tags,
    availability: skillFieldSchemas.availability,
    price: skillFieldSchemas.price,
    isBarter: skillFieldSchemas.isBarter,
})
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Provide at least one field to update",
    path: ["title"],
});
