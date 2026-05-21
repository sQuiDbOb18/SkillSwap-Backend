import jwt from "jsonwebtoken"

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
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessTokenPayload
}

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as RefreshTokenPayload
}
