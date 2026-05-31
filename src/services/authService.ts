import {
    createUser,
    deletePendingRegistration,
    findAnyUserByEmail,
    findPendingRegistrationByEmail,
    findUserByRefreshTokenHash,
    findUserByEmail,
    findPendingRegistrationByVerificationCode,
    updateUser,
    upsertPendingRegistration
} from "../repositories/userRepository"
import { OAuth2Client } from "google-auth-library"
import crypto from "crypto"
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken"
import { hashPassword, comparePassword } from "../utils/hash"
import { generateVerificationCode, hashCode } from "../utils/generateCode"
import { CustomError } from "../utils/CustomError"
import { sendVerificationEmail, sendWelcomeEmail } from "./emailService"
import { verifyRefreshToken } from "../utils/authToken"
import { z } from "zod"
import { googleAuthSchema, loginSchema, registerSchema } from "../validations/authValidation"
import { env } from "../config/env"

type RegisterUserInput = z.infer<typeof registerSchema>
type LoginUserInput = z.infer<typeof loginSchema>
type GoogleAuthInput = z.infer<typeof googleAuthSchema>
type GoogleProfile = {
    email: string
    fullName: string
    profileImage?: string
}

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ")

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

const createTokenPair = (userId: string, role: string, tokenVersion: number) => {
    const accessToken = generateAccessToken(userId, role, tokenVersion)
    const refreshToken = generateRefreshToken(userId, tokenVersion)

    return {
        accessToken,
        refreshToken
    }
}

const persistRefreshToken = async (userId: string, refreshToken: string) => {
    await updateUser(userId, {
        refreshTokenHash: hashCode(refreshToken),
        refreshTokenExpires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    })
}

const getGoogleClientId = () => {
    if (!env.GOOGLE_CLIENT_ID) {
        throw new CustomError("Google sign-in is not configured", 500)
    }

    return env.GOOGLE_CLIENT_ID
}

const getGoogleIdTokenFromCode = async (code: string, redirectUri?: string) => {
    const clientId = getGoogleClientId()
    if (!env.GOOGLE_CLIENT_SECRET) {
        throw new CustomError("Google sign-in is not configured", 500)
    }

    const resolvedRedirectUri = redirectUri ?? env.GOOGLE_REDIRECT_URI
    if (!resolvedRedirectUri) {
        throw new CustomError("Google redirect URI is required", 400)
    }

    const client = new OAuth2Client(clientId, env.GOOGLE_CLIENT_SECRET, resolvedRedirectUri)
    const { tokens } = await client.getToken(code)
    if (!tokens.id_token) {
        throw new CustomError("Google did not return an ID token", 401)
    }

    return tokens.id_token
}

const verifyGoogleProfile = async (data: GoogleAuthInput): Promise<GoogleProfile> => {
    const clientId = getGoogleClientId()
    const idToken = data.idToken ?? await getGoogleIdTokenFromCode(data.code as string, data.redirectUri)
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId
    })
    const payload = ticket.getPayload()

    if (!payload?.email) {
        throw new CustomError("Google account email is required", 401)
    }

    if (!payload.email_verified) {
        throw new CustomError("Google account email is not verified", 403)
    }

    return {
        email: payload.email.toLowerCase(),
        fullName: normalizeName(payload.name ?? payload.email.split("@")[0]),
        profileImage: payload.picture
    }
}

const issueTokensForUser = async (user: { id: string; role: string; tokenVersion: number }) => {
    const tokens = createTokenPair(user.id, user.role, user.tokenVersion)
    await persistRefreshToken(user.id, tokens.refreshToken)

    return tokens
}

export const registerUser = async (data: RegisterUserInput) => {
    const {
        name,
        email,
        password
    } = data

    const existingEmail = await findAnyUserByEmail(email)
    if (existingEmail) {
        if (existingEmail.deletedAt) {
            throw new CustomError("Account is deleted. Restore it instead of registering again.", 400)
        }
        throw new CustomError("User already exists", 400)
    }

    const hashedPassword = await hashPassword(password)
    const { rawCode, hashedCode } = generateVerificationCode()
    const expires = new Date(Date.now() + 15 * 60 * 1000)

    await upsertPendingRegistration({
        email,
        password: hashedPassword,
        fullName: normalizeName(name),
        verificationCode: hashedCode,
        verificationCodeExpires: expires
    })

    await sendVerificationEmail({
        email,
        name: normalizeName(name),
        code: rawCode
    })

    return {
        message: "Verification code sent to your email address.",
        email
    }
}

export const verifyEmail = async (code: string) => {
    const pendingRegistration = await findPendingRegistrationByVerificationCode(hashCode(code))
    if (!pendingRegistration) {
        throw new CustomError("Invalid verification code", 400)
    }
    if (pendingRegistration.verificationCodeExpires < new Date()) {
        throw new CustomError("Verification code has expired", 400)
    }

    const existingEmail = await findAnyUserByEmail(pendingRegistration.email)
    if (existingEmail) {
        if (existingEmail.deletedAt) {
            throw new CustomError("Account is deleted. Restore it instead of registering again.", 400)
        }
        throw new CustomError("User already exists", 400)
    }

    const verifiedUser = await createUser({
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        fullName: pendingRegistration.fullName,
        isVerified: true
    })

    await deletePendingRegistration(pendingRegistration.id)

    await sendWelcomeEmail({
        email: verifiedUser.email,
        name: verifiedUser.fullName
    })

    const tokens = await issueTokensForUser(verifiedUser)

    return {
        message: "Email verified successfully",
        ...tokens
    }
}

export const resendVerificationCode = async (email: string) => {
    const existingUser = await findAnyUserByEmail(email)

    if (existingUser) {
        if (existingUser.deletedAt) {
            throw new CustomError("Account is deleted. Restore it instead of verifying again.", 400)
        }
        throw new CustomError("This account is already registered", 400)
    }

    const pendingRegistration = await findPendingRegistrationByEmail(email)
    if (!pendingRegistration) {
        throw new CustomError("No pending registration found for this email", 404)
    }

    const { rawCode, hashedCode } = generateVerificationCode()
    const expires = new Date(Date.now() + 15 * 60 * 1000)

    await upsertPendingRegistration({
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        fullName: pendingRegistration.fullName,
        verificationCode: hashedCode,
        verificationCodeExpires: expires
    })

    await sendVerificationEmail({
        email: pendingRegistration.email,
        name: pendingRegistration.fullName,
        code: rawCode
    })

    return {
        message: "Verification code resent to your email address.",
        email: pendingRegistration.email
    }
}

export const loginUser = async ({ email, password }: LoginUserInput) => {
    const user = await findUserByEmail(email)
    if (!user) {
        const deletedUser = await findAnyUserByEmail(email)
        if (deletedUser?.deletedAt) {
            throw new CustomError("Account is deleted. Restore your account to continue.", 403)
        }
        throw new CustomError("User not found", 404)
    }

    if (!user.isVerified) {
        throw new CustomError("Please verify your email before signing in", 403)
    }

    const isMatch = await comparePassword(password, user.password)
    if (!isMatch) {
        throw new CustomError("Invalid credentials", 401)
    }

    return issueTokensForUser(user)
}

export const loginWithGoogle = async (data: GoogleAuthInput) => {
    const profile = await verifyGoogleProfile(data)
    const existingUser = await findAnyUserByEmail(profile.email)

    if (existingUser?.deletedAt) {
        throw new CustomError("Account is deleted. Restore your account to continue.", 403)
    }

    if (existingUser) {
        if (!existingUser.isVerified) {
            await updateUser(existingUser.id, { isVerified: true })
        }

        return issueTokensForUser(existingUser)
    }

    const pendingRegistration = await findPendingRegistrationByEmail(profile.email)
    if (pendingRegistration) {
        await deletePendingRegistration(pendingRegistration.id)
    }

    const password = await hashPassword(crypto.randomBytes(32).toString("hex"))
    const user = await createUser({
        email: profile.email,
        password,
        fullName: profile.fullName,
        profileImage: profile.profileImage,
        isVerified: true
    })

    await sendWelcomeEmail({
        email: user.email,
        name: user.fullName
    })

    return issueTokensForUser(user)
}

export const refreshUserTokens = async (refreshToken: string) => {
    if (!refreshToken) {
        throw new CustomError("Refresh token is required", 401)
    }

    const decoded = verifyRefreshToken(refreshToken)
    const user = await findUserByRefreshTokenHash(hashCode(refreshToken))

    if (!user || user.deletedAt) {
        throw new CustomError("Invalid refresh token", 401)
    }

    if (decoded.userId !== user.id || decoded.tokenVersion !== user.tokenVersion) {
        throw new CustomError("Refresh token is no longer valid", 401)
    }

    if (!user.refreshTokenExpires || user.refreshTokenExpires < new Date()) {
        throw new CustomError("Refresh token has expired", 401)
    }

    const tokens = createTokenPair(user.id, user.role, user.tokenVersion)
    await persistRefreshToken(user.id, tokens.refreshToken)

    return tokens
}

export const logoutUser = async (userId: string) => {
    await updateUser(userId, {
        refreshTokenHash: null,
        refreshTokenExpires: null,
        tokenVersion: {
            increment: 1
        }
    })

    return { message: "Logged out successfully" }
}
