import { Request, Response } from "express"

const REFRESH_TOKEN_COOKIE_NAME = "refreshToken"
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

const parseCookies = (cookieHeader?: string) => {
    if (!cookieHeader) {
        return {}
    }

    return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
        const [rawKey, ...rawValue] = part.trim().split("=")

        if (!rawKey) {
            return acc
        }

        acc[rawKey] = decodeURIComponent(rawValue.join("="))
        return acc
    }, {})
}

export const getRefreshTokenFromRequest = (req: Request) => {
    const bodyRefreshToken = req.body?.refreshToken

    if (typeof bodyRefreshToken === "string" && bodyRefreshToken.trim()) {
        return bodyRefreshToken
    }

    const cookies = parseCookies(req.headers.cookie)
    return cookies[REFRESH_TOKEN_COOKIE_NAME] ?? null
}

export const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: REFRESH_TOKEN_TTL_MS,
        path: "/api/auth"
    })
}

export const clearRefreshTokenCookie = (res: Response) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/auth"
    })
}
