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
    var _a, _b;
    const bodyRefreshToken = (_a = req.body) === null || _a === void 0 ? void 0 : _a.refreshToken;
    if (typeof bodyRefreshToken === "string" && bodyRefreshToken.trim()) {
        return bodyRefreshToken;
    }
    const cookies = parseCookies(req.headers.cookie);
    return (_b = cookies[REFRESH_TOKEN_COOKIE_NAME]) !== null && _b !== void 0 ? _b : null;
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
