"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreAccountController = exports.deleteAccountController = exports.verifyResetPasswordCodeController = exports.resetPasswordController = exports.forgotPasswordController = exports.verifyEmailChangeRedirect = exports.verifyEmailChange = exports.changeEmailController = exports.changePasswordController = exports.updateProfile = exports.getProfile = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const email_1 = require("../config/email");
const refreshTokenCookie_1 = require("../utils/refreshTokenCookie");
const userService_1 = require("../services/userService");
exports.getProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await (0, userService_1.getUserProfile)(req.user.userId);
    res.json(user);
});
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const updated = await (0, userService_1.updateUserProfile)(req.user.userId, req.body);
    res.json(updated);
});
exports.changePasswordController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await (0, userService_1.changePassword)(req.user.userId, currentPassword, newPassword);
    res.json(result);
});
exports.changeEmailController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const result = await (0, userService_1.changeEmail)(req.user.userId, email);
    res.json(result);
});
exports.verifyEmailChange = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { code } = req.body;
    const result = await (0, userService_1.verifyNewEmail)(code);
    res.json(result);
});
exports.verifyEmailChangeRedirect = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    var _a, _b;
    const code = String((_a = req.query.token) !== null && _a !== void 0 ? _a : "");
    try {
        await (0, userService_1.verifyNewEmail)(code);
        res.redirect(email_1.emailConfig.verifyEmailChangeSuccessRedirect("Email verified successfully"));
    }
    catch (error) {
        const message = (_b = error === null || error === void 0 ? void 0 : error.message) !== null && _b !== void 0 ? _b : "Email verification failed";
        res.redirect(email_1.emailConfig.verifyEmailChangeFailureRedirect(message));
    }
});
exports.forgotPasswordController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    const result = await (0, userService_1.forgotPassword)(email);
    res.json(result);
});
exports.resetPasswordController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { code, newPassword } = req.body;
    const result = await (0, userService_1.resetPassword)(code, newPassword);
    res.json(result);
});
exports.verifyResetPasswordCodeController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { code } = req.body;
    const result = await (0, userService_1.verifyResetPasswordCode)(code);
    res.json(result);
});
exports.deleteAccountController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, userService_1.deleteAccount)(req.user.userId, req.body);
    res.json(result);
});
exports.restoreAccountController = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, userService_1.restoreAccount)(req.body);
    (0, refreshTokenCookie_1.setRefreshTokenCookie)(res, result.refreshToken);
    res.json(result);
});
