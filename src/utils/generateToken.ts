import jwt, { SignOptions } from "jsonwebtoken"

const ACCESS_TOKEN_EXPIRES_IN = (process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m") as SignOptions["expiresIn"]
const REFRESH_TOKEN_EXPIRES_IN = (process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"]

export const generateAccessToken = (userId: string, role: string, tokenVersion: number) => {
    return jwt.sign(
        { userId, role, tokenVersion },
        process.env.JWT_ACCESS_SECRET as string,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    )
}

export const generateRefreshToken = (userId: string, tokenVersion: number) => {
    return jwt.sign(
        { userId, tokenVersion, type: "refresh" },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    )
}
