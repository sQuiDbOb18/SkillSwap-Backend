import {
    createUser,
    deletePendingRegistration,
    findAnyUserByEmail,
    findUserByRefreshTokenHash,
    findUserByEmail,
    findPendingRegistrationByVerificationCode,
    updateUser,
    upsertPendingRegistration
} from "../repositories/userRepository"
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken"
import { hashPassword, comparePassword } from "../utils/hash"
import { generateVerificationCode, hashCode } from "../utils/generateCode"
import { CustomError } from "../utils/CustomError"
import { sendVerificationEmail, sendWelcomeEmail } from "./emailService"
import { verifyRefreshToken } from "../utils/authToken"
import { z } from "zod"
import { loginSchema, registerSchema } from "../validations/authValidation"

type RegisterUserInput = z.infer<typeof registerSchema>
type LoginUserInput = z.infer<typeof loginSchema>

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

    return { message: "Email verified successfully" }
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

    const tokens = createTokenPair(user.id, user.role, user.tokenVersion)
    await persistRefreshToken(user.id, tokens.refreshToken)

    return tokens
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
