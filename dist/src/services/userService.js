"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreAccount = exports.deleteAccount = exports.verifyResetPasswordCode = exports.resetPassword = exports.forgotPassword = exports.verifyNewEmail = exports.changeEmail = exports.changePassword = exports.updateUserProfile = exports.getUserProfile = void 0;
const email_1 = require("../config/email");
const CustomError_1 = require("../utils/CustomError");
const userRepository_1 = require("../repositories/userRepository");
const hash_1 = require("../utils/hash");
const generateCode_1 = require("../utils/generateCode");
const generateToken_1 = require("../utils/generateToken");
const emailService_1 = require("./emailService");
const getUserProfile = async (userId) => {
    const user = await (0, userRepository_1.findUserById)(userId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const sessionStats = await (0, userRepository_1.getUserSessionStats)(userId);
    return {
        ...user,
        sessionStats
    };
};
exports.getUserProfile = getUserProfile;
const updateUserProfile = async (userId, data) => {
    return await (0, userRepository_1.updateUser)(userId, data);
};
exports.updateUserProfile = updateUserProfile;
const fieldError = (field, message, statusCode = 400) => new CustomError_1.CustomError(message, statusCode, {
    type: "VALIDATION_ERROR",
    errors: [{ field, message }],
});
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await (0, userRepository_1.findUserById)(userId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const userWithPassword = await (0, userRepository_1.findAnyUserByEmail)(user.email);
    if (!userWithPassword) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const isMatch = await (0, hash_1.comparePassword)(currentPassword, userWithPassword.password);
    if (!isMatch) {
        throw fieldError("currentPassword", "Current password is incorrect");
    }
    const samePassword = await (0, hash_1.comparePassword)(newPassword, userWithPassword.password);
    if (samePassword) {
        throw fieldError("newPassword", "New password cannot be the same as the current password");
    }
    const hashedPassword = await (0, hash_1.hashPassword)(newPassword);
    return await (0, userRepository_1.updateUser)(userId, {
        password: hashedPassword,
        refreshTokenHash: null,
        refreshTokenExpires: null,
        tokenVersion: {
            increment: 1
        }
    });
};
exports.changePassword = changePassword;
const changeEmail = async (userId, newEmail) => {
    const user = await (0, userRepository_1.findUserById)(userId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
        throw fieldError("email", "Please enter a different email address");
    }
    const existingUser = await (0, userRepository_1.findAnyUserByEmail)(newEmail);
    if (existingUser && existingUser.id !== userId) {
        if (existingUser.deletedAt) {
            throw fieldError("email", "Email belongs to a deleted account and cannot be reused until restored.");
        }
        throw fieldError("email", "Email already exists");
    }
    const existingPendingEmail = await (0, userRepository_1.findUserByPendingEmail)(newEmail);
    if (existingPendingEmail && existingPendingEmail.id !== userId) {
        throw fieldError("email", "That email is already being verified by another account");
    }
    const { rawCode, hashedCode } = (0, generateCode_1.generateVerificationCode)();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    const updatedUser = await (0, userRepository_1.updateUser)(userId, {
        pendingEmail: newEmail,
        verificationCode: hashedCode,
        verificationCodeExpires: expires,
    });
    await (0, emailService_1.sendEmailChangeVerificationEmail)({
        email: newEmail,
        name: updatedUser.fullName,
        code: rawCode
    });
    return { message: "Verification code sent to your new email address" };
};
exports.changeEmail = changeEmail;
const verifyNewEmail = async (code) => {
    const user = await (0, userRepository_1.findUserByVerificationCode)((0, generateCode_1.hashCode)(code));
    if (!user) {
        throw fieldError("code", "The verification code is incorrect");
    }
    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
        throw fieldError("code", "This verification code has expired. Request a new one.");
    }
    if (!user.pendingEmail) {
        throw fieldError("code", "There is no email change request to verify");
    }
    const existingUser = await (0, userRepository_1.findAnyUserByEmail)(user.pendingEmail);
    if (existingUser && existingUser.id !== user.id) {
        throw fieldError("email", "That email address is no longer available");
    }
    const updatedUser = await (0, userRepository_1.updateUser)(user.id, {
        email: user.pendingEmail,
        pendingEmail: null,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null
    });
    await (0, emailService_1.sendEmailChangeSuccessEmail)({
        email: updatedUser.email,
        name: updatedUser.fullName,
        actionUrl: email_1.emailConfig.appHomeUrl,
    });
    return updatedUser;
};
exports.verifyNewEmail = verifyNewEmail;
const forgotPassword = async (email) => {
    const user = await (0, userRepository_1.findUserByEmail)(email);
    if (!user) {
        throw fieldError("email", "No account was found with that email address", 404);
    }
    const { rawCode, hashedCode } = (0, generateCode_1.generateEmailCode)();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await (0, userRepository_1.updateUser)(user.id, {
        resetPasswordToken: hashedCode,
        resetPasswordExpires: expires,
    });
    await (0, emailService_1.sendPasswordResetEmail)({
        email: user.email,
        name: user.fullName,
        code: rawCode
    });
    return { message: "Password reset code sent" };
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (code, newPassword) => {
    const user = await (0, userRepository_1.findUserByResetToken)((0, generateCode_1.hashCode)(code));
    if (!user) {
        throw fieldError("code", "The reset code is incorrect");
    }
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
        throw fieldError("code", "This reset code has expired. Request a new one.");
    }
    const samePassword = await (0, hash_1.comparePassword)(newPassword, user.password);
    if (samePassword) {
        throw fieldError("newPassword", "New password cannot be the same as your current password");
    }
    const hashedPassword = await (0, hash_1.hashPassword)(newPassword);
    await (0, userRepository_1.updateUser)(user.id, {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshTokenHash: null,
        refreshTokenExpires: null,
        tokenVersion: {
            increment: 1
        }
    });
    await (0, emailService_1.sendPasswordResetSuccessEmail)({
        email: user.email,
        name: user.fullName,
        actionUrl: email_1.emailConfig.signInPageUrl,
    });
    return { message: "Password reset successful" };
};
exports.resetPassword = resetPassword;
const verifyResetPasswordCode = async (code) => {
    const user = await (0, userRepository_1.findUserByResetToken)((0, generateCode_1.hashCode)(code));
    if (!user) {
        throw fieldError("code", "The reset code is incorrect");
    }
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
        throw fieldError("code", "This reset code has expired. Request a new one.");
    }
    return {
        message: "Reset code verified successfully",
        email: user.email
    };
};
exports.verifyResetPasswordCode = verifyResetPasswordCode;
const deleteAccount = async (userId, data) => {
    const user = await (0, userRepository_1.findUserById)(userId);
    if (!user) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const userWithPassword = await (0, userRepository_1.findAnyUserByEmail)(user.email);
    if (!userWithPassword) {
        throw new CustomError_1.CustomError("User not found", 404);
    }
    const isMatch = await (0, hash_1.comparePassword)(data.password, userWithPassword.password);
    if (!isMatch) {
        throw fieldError("password", "Password is incorrect");
    }
    await (0, userRepository_1.softDeleteUser)(userId, data.reason);
    return {
        message: "Account deleted successfully. You can restore it later with your email and password."
    };
};
exports.deleteAccount = deleteAccount;
const restoreAccount = async (data) => {
    const user = await (0, userRepository_1.findAnyUserByEmail)(data.email);
    if (!user || !user.deletedAt) {
        throw new CustomError_1.CustomError("Deleted account not found", 404);
    }
    const isMatch = await (0, hash_1.comparePassword)(data.password, user.password);
    if (!isMatch) {
        throw fieldError("password", "Password is incorrect", 401);
    }
    const restoredUser = await (0, userRepository_1.restoreDeletedUser)(user.id);
    const accessToken = (0, generateToken_1.generateAccessToken)(restoredUser.id, restoredUser.role, restoredUser.tokenVersion);
    const refreshToken = (0, generateToken_1.generateRefreshToken)(restoredUser.id, restoredUser.tokenVersion);
    await (0, userRepository_1.updateUser)(restoredUser.id, {
        refreshTokenHash: (0, generateCode_1.hashCode)(refreshToken),
        refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return {
        message: "Account restored successfully",
        accessToken,
        refreshToken
    };
};
exports.restoreAccount = restoreAccount;
