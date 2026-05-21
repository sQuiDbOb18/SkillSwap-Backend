"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshTokens = exports.login = exports.verifyEmailController = exports.register = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const authService_1 = require("../services/authService");
const refreshTokenCookie_1 = require("../utils/refreshTokenCookie");
exports.register = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, authService_1.registerUser)(req.body);
    res.status(201).json(result);
});
exports.verifyEmailController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { code } = req.body;
    const result = await (0, authService_1.verifyEmail)(code);
    res.status(201).json(result);
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, authService_1.loginUser)(req.body);
    (0, refreshTokenCookie_1.setRefreshTokenCookie)(res, result.refreshToken);
    res.json(result);
});
exports.refreshTokens = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const refreshToken = (0, refreshTokenCookie_1.getRefreshTokenFromRequest)(req);
    const result = await (0, authService_1.refreshUserTokens)(refreshToken);
    (0, refreshTokenCookie_1.setRefreshTokenCookie)(res, result.refreshToken);
    res.json(result);
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, authService_1.logoutUser)(req.user.userId);
    (0, refreshTokenCookie_1.clearRefreshTokenCookie)(res);
    res.json(result);
});
