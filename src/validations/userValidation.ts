import { z } from "zod";
const nameRegex = 
/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/
const phoneRegex = 
/^0\d{10}$/


export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .trim()
      .length(6, "Reset code must be 6 digits")
      .regex(/^\d{6}$/, "Reset code must contain only digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address")
})

export const verifyResetPasswordCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, "Reset code must be 6 digits")
    .regex(/^\d{6}$/, "Reset code must contain only digits")
})

export const verifyEmailTokenSchema = z.object({
  code: z
    .string()
    .trim()
    .length(4, "Verification code must be 4 digits")
    .regex(/^\d{4}$/, "Verification code must contain only digits")
})


export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8,"Password must be at least 8 characters"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),

    confirmNewPassword: z
      .string()
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"]
  })

  export const updateProfileSchema = z
  .object({
    fullName: z
          .string()
          .trim()
          .min(2, "Full name is too short")
          .regex(nameRegex, "Full name can only contain letters, spaces, apostrophes, and hyphens")
          .optional(),
    
        username: z
          .string()
          .min(6, "Username must be at least 6 letters")
          .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscore")
          .optional(),
    
        age: z
          .number()
          .int()
          .positive()
          .min(13, "Age must be at least 13")
          .optional(),
    
        phoneNumber: z
          .string()
          .regex(phoneRegex, "Phone number must start with 0 and be 11 digits")
          .optional(),

        bio: z
          .string()
          .trim()
          .min(2, "Bio must be at least 2 characters")
          .max(250, "Bio must not exceed 250 characters")
          .optional(),

        profileImage: z
          .url("Profile image must be a valid URL")
          .optional(),
  }).strict()

  export const changeEmailSchema = z.object({
    email: z.string().trim().email("Invalid email address")
  })

  export const deleteAccountSchema = z.object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    reason: z
      .string()
      .trim()
      .max(250, "Reason must not exceed 250 characters")
      .optional()
  })

  export const restoreAccountSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
  })
