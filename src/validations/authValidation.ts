import { z } from "zod"
const fullNameRegex =
/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name is too short")
      .regex(fullNameRegex, "Name can only contain letters, spaces, apostrophes, and hyphens"),
   
    email: z
      .string()
      .email("Invalid email format"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),

    confirmPassword: z.string()
  })

  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match", 
    path: ["confirmPassword"]
  })

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
})

export const googleAuthSchema = z
  .object({
    idToken: z.string().trim().min(1, "Google ID token is required").optional(),
    code: z.string().trim().min(1, "Google authorization code is required").optional(),
    redirectUri: z.string().trim().url("Invalid redirect URI").optional(),
  })
  .refine((data) => Boolean(data.idToken || data.code), {
    message: "Provide either a Google ID token or authorization code",
    path: ["idToken"],
  })
