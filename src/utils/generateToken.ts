import jwt, { SignOptions } from "jsonwebtoken"
import { env } from "../config/env"

const ACCESS_TOKEN_EXPIRES_IN = env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"]
const REFRESH_TOKEN_EXPIRES_IN = env.REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"]

export const generateAccessToken = (userId: string, role: string, tokenVersion: number) => {
    return jwt.sign(
        { userId, role, tokenVersion },
        env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    )
}

export const generateRefreshToken = (userId: string, tokenVersion: number) => {
    return jwt.sign(
        { userId, tokenVersion, type: "refresh" },
        env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    )
}
