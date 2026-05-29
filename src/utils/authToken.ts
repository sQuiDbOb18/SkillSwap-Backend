import jwt from "jsonwebtoken"
import { env } from "../config/env"

export type AccessTokenPayload = {
  userId: string
  role: string
  tokenVersion: number
  iat?: number
  exp?: number
}

export type RefreshTokenPayload = {
  userId: string
  tokenVersion: number
  type: "refresh"
  iat?: number
  exp?: number
}

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}
