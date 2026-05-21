"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const fullNameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
exports.registerSchema = zod_1.z
    .object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Name is too short")
        .regex(fullNameRegex, "Name can only contain letters, spaces, apostrophes, and hyphens"),
    email: zod_1.z
        .string()
        .email("Invalid email format"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: zod_1.z.string()
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Invalid email format"),
    password: zod_1.z
        .string()
        .min(1, "Password is required"),
});
