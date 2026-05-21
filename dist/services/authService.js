"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.refreshUserTokens = exports.loginUser = exports.verifyEmail = exports.registerUser = void 0;
const userRepository_1 = require("../repositories/userRepository");
const generateToken_1 = require("../utils/generateToken");
const hash_1 = require("../utils/hash");
const generateCode_1 = require("../utils/generateCode");
const CustomError_1 = require("../utils/CustomError");
const emailService_1 = require("./emailService");
const authToken_1 = require("../utils/authToken");
const normalizeName = (name) => name.trim().replace(/\s+/g, " ");
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const createTokenPair = (userId, role, tokenVersion) => {
    const accessToken = (0, generateToken_1.generateAccessToken)(userId, role, tokenVersion);
    const refreshToken = (0, generateToken_1.generateRefreshToken)(userId, tokenVersion);
    return {
        accessToken,
        refreshToken
    };
};
const persistRefreshToken = async (userId, refreshToken) => {
    await (0, userRepository_1.updateUser)(userId, {
        refreshTokenHash: (0, generateCode_1.hashCode)(refreshToken),
        refreshTokenExpires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    });
};
const registerUser = async (data) => {
    const { name, email, password } = data;
    const existingEmail = await (0, userRepository_1.findAnyUserByEmail)(email);
    if (existingEmail) {
        if (existingEmail.deletedAt) {
            throw new CustomError_1.CustomError("Account is deleted. Restore it instead of registering again.", 400);
        }
        throw new CustomError_1.CustomError("User already exists", 400);
    }
    const hashedPassword = await (0, hash_1.hashPassword)(password);
    const { rawCode, hashedCode } = (0, generateCode_1.generateVerificationCode)();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await (0, userRepository_1.upsertPendingRegistration)({
        email,
        password: hashedPassword,
        fullName: normalizeName(name),
        verificationCode: hashedCode,
        verificationCodeExpires: expires
    });
    await (0, emailService_1.sendVerificationEmail)({
        email,
        name: normalizeName(name),
        code: rawCode
    });
    return {
        message: "Verification code sent to your email address.",
        email
    };
};
exports.registerUser = registerUser;
const verifyEmail = async (code) => {
    const pendingRegistration = await (0, userRepository_1.findPendingRegistrationByVerificationCode)((0, generateCode_1.hashCode)(code));
    if (!pendingRegistration) {
        throw new CustomError_1.CustomError("Invalid verification code", 400);
    }
    if (pendingRegistration.verificationCodeExpires < new Date()) {
        throw new CustomError_1.CustomError("Verification code has expired", 400);
    }
    const existingEmail = await (0, userRepository_1.findAnyUserByEmail)(pendingRegistration.email);
    if (existingEmail) {
        if (existingEmail.deletedAt) {
            throw new CustomError_1.CustomError("Account is deleted. Restore it instead of registering again.", 400);
        }
        throw new CustomError_1.CustomError("User already exists", 400);
    }
    const verifiedUser = await (0, userRepository_1.createUser)({
        email: pendingRegistration.email,
        password: pendingRegistration.password,
        fullName: pendingRegistration.fullName,
        isVerified: true
    });
    await (0, userRepository_1.deletePendingRegistration)(pendingRegistration.id);
    await (0, emailService_1.sendWelcomeEmail)({
        email: verifiedUser.email,
        name: verifiedUser.fullName
    });
    return { message: "Email verified successfully" };
};
exports.verifyEmail = verifyEmail;
const loginUser = async ({ email, password }) => {
    const user = await (0, userRepository_1.findUserByEmail)(email);
    if (!user) {
        const deletedUser = await (0, userRepository_1.findAnyUserByEmail)(email);
        if (deletedUser === null || deletedUser === void 0 ? void 0 : deletedUser.deletedAt) {
            throw new CustomError_1.CustomError("Account is deleted. Restore your account to continue.", 403);
        }
        throw new CustomError_1.CustomError("User not found", 404);
    }
    if (!user.isVerified) {
        throw new CustomError_1.CustomError("Please verify your email before signing in", 403);
    }
    const isMatch = await (0, hash_1.comparePassword)(password, user.password);
    if (!isMatch) {
        throw new CustomError_1.CustomError("Invalid credentials", 401);
    }
    const tokens = createTokenPair(user.id, user.role, user.tokenVersion);
    await persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
};
exports.loginUser = loginUser;
const refreshUserTokens = async (refreshToken) => {
    if (!refreshToken) {
        throw new CustomError_1.CustomError("Refresh token is required", 401);
    }
    const decoded = (0, authToken_1.verifyRefreshToken)(refreshToken);
    const user = await (0, userRepository_1.findUserByRefreshTokenHash)((0, generateCode_1.hashCode)(refreshToken));
    if (!user || user.deletedAt) {
        throw new CustomError_1.CustomError("Invalid refresh token", 401);
    }
    if (decoded.userId !== user.id || decoded.tokenVersion !== user.tokenVersion) {
        throw new CustomError_1.CustomError("Refresh token is no longer valid", 401);
    }
    if (!user.refreshTokenExpires || user.refreshTokenExpires < new Date()) {
        throw new CustomError_1.CustomError("Refresh token has expired", 401);
    }
    const tokens = createTokenPair(user.id, user.role, user.tokenVersion);
    await persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
};
exports.refreshUserTokens = refreshUserTokens;
const logoutUser = async (userId) => {
    await (0, userRepository_1.updateUser)(userId, {
        refreshTokenHash: null,
        refreshTokenExpires: null,
        tokenVersion: {
            increment: 1
        }
    });
    return { message: "Logged out successfully" };
};
exports.logoutUser = logoutUser;
