"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRefreshTokenCookie = exports.setRefreshTokenCookie = exports.getRefreshTokenFromRequest = void 0;
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const parseCookies = (cookieHeader) => {
    if (!cookieHeader) {
        return {};
    }
    return cookieHeader.split(";").reduce((acc, part) => {
        const [rawKey, ...rawValue] = part.trim().split("=");
        if (!rawKey) {
            return acc;
        }
        acc[rawKey] = decodeURIComponent(rawValue.join("="));
        return acc;
    }, {});
};
const getRefreshTokenFromRequest = (req) => {
    const bodyRefreshToken = req.body?.refreshToken;
    if (typeof bodyRefreshToken === "string" && bodyRefreshToken.trim()) {
        return bodyRefreshToken;
    }
    const cookies = parseCookies(req.headers.cookie);
    return cookies[REFRESH_TOKEN_COOKIE_NAME] ?? null;
};
exports.getRefreshTokenFromRequest = getRefreshTokenFromRequest;
const setRefreshTokenCookie = (res, refreshToken) => {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: REFRESH_TOKEN_TTL_MS,
        path: "/api/auth"
    });
};
exports.setRefreshTokenCookie = setRefreshTokenCookie;
const clearRefreshTokenCookie = (res) => {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/api/auth"
    });
};
exports.clearRefreshTokenCookie = clearRefreshTokenCookie;
