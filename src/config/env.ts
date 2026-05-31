import { z } from "zod"

const emptyToUndefined = (value: unknown) => value === "" ? undefined : value
const optionalString = z.preprocess(emptyToUndefined, z.string().optional())
const optionalEmail = z.preprocess(emptyToUndefined, z.string().email().optional())
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional())

const envSource = {
  ...process.env,
  ...(process.env.NODE_ENV === "test"
    ? {
        DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/skillswap_test",
        JWT_ACCESS_SECRET:
          process.env.JWT_ACCESS_SECRET ?? "test_access_secret_that_is_long_enough_32",
        JWT_REFRESH_SECRET:
          process.env.JWT_REFRESH_SECRET ?? "test_refresh_secret_that_is_long_enough_32",
      }
    : {}),
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  API_URL: z.string().default("http://localhost:4000"),
  REDIS_URL: optionalString,
  APP_NAME: z.string().default("SkillSwap"),
  SUPPORT_EMAIL: z.string().email().default("support@example.com"),
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: optionalEmail,
  RESEND_FROM_NAME: optionalString,
  RESEND_REPLY_TO: optionalEmail,
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  BOOKINGS_PAGE_URL: optionalUrl,
  SIGN_IN_URL: optionalUrl,
  APP_HOME_URL: optionalUrl,
  MAIL_FROM_EMAIL: optionalEmail,
  MAIL_FROM_NAME: optionalString,
  VERIFY_ACCOUNT_URL: optionalUrl,
  VERIFY_EMAIL_CHANGE_URL: optionalUrl,
  RESET_PASSWORD_URL: optionalUrl,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GOOGLE_REDIRECT_URI: optionalUrl,
  VERIFY_ACCOUNT_SUCCESS_URL: optionalUrl,
  VERIFY_ACCOUNT_FAILURE_URL: optionalUrl,
  VERIFY_EMAIL_CHANGE_SUCCESS_URL: optionalUrl,
  VERIFY_EMAIL_CHANGE_FAILURE_URL: optionalUrl,
})

const parsedEnv = envSchema.safeParse(envSource)

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ")

  throw new Error(`Invalid environment configuration: ${details}`)
}

export const env = parsedEnv.data

export const allowedOrigins = env.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
