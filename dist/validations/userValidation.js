"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreAccountSchema = exports.deleteAccountSchema = exports.changeEmailSchema = exports.updateProfileSchema = exports.changePasswordSchema = exports.verifyEmailTokenSchema = exports.verifyResetPasswordCodeSchema = exports.forgotPasswordSchema = exports.resetPasswordSchema = void 0;
const zod_1 = require("zod");
const nameRegex = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const phoneRegex = /^0\d{10}$/;
exports.resetPasswordSchema = zod_1.z
    .object({
    code: zod_1.z
        .string()
        .trim()
        .length(6, "Reset code must be 6 digits")
        .regex(/^\d{6}$/, "Reset code must contain only digits"),
    newPassword: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: zod_1.z.string().min(1, "Please confirm your new password"),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address")
});
exports.verifyResetPasswordCodeSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .trim()
        .length(6, "Reset code must be 6 digits")
        .regex(/^\d{6}$/, "Reset code must contain only digits")
});
exports.verifyEmailTokenSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .trim()
        .length(4, "Verification code must be 4 digits")
        .regex(/^\d{4}$/, "Verification code must contain only digits")
});
exports.changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters"),
    newPassword: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain an uppercase letter")
        .regex(/[0-9]/, "Password must contain a number")
        .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmNewPassword: zod_1.z
        .string()
})
    .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"]
});
exports.updateProfileSchema = zod_1.z
    .object({
    fullName: zod_1.z
        .string()
        .trim()
        .min(2, "Full name is too short")
        .regex(nameRegex, "Full name can only contain letters, spaces, apostrophes, and hyphens")
        .optional(),
    username: zod_1.z
        .string()
        .min(6, "Username must be at least 6 letters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscore")
        .optional(),
    age: zod_1.z
        .number()
        .int()
        .positive()
        .min(13, "Age must be at least 13")
        .optional(),
    phoneNumber: zod_1.z
        .string()
        .regex(phoneRegex, "Phone number must start with 0 and be 11 digits")
        .optional(),
    bio: zod_1.z
        .string()
        .trim()
        .min(2, "Bio must be at least 2 characters")
        .max(250, "Bio must not exceed 250 characters")
        .optional(),
}).strict();
exports.changeEmailSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email("Invalid email address")
});
exports.deleteAccountSchema = zod_1.z.object({
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters"),
    reason: zod_1.z
        .string()
        .trim()
        .max(250, "Reason must not exceed 250 characters")
        .optional()
});
exports.restoreAccountSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
});
