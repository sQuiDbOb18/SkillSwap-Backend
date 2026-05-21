"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restoreDeletedUser = exports.softDeleteUser = exports.verifyUser = exports.findUserByResetToken = exports.findUserByVerificationCode = exports.updateUserLastSeen = exports.updateUser = exports.findUserByRefreshTokenHash = exports.findUserForAuthById = exports.findUserById = exports.findAnyUserByPhoneNumber = exports.findUserByPhoneNumber = exports.findAnyUserByUsername = exports.findUserByUsername = exports.findAnyUserByEmail = exports.findUserByPendingEmail = exports.findUserByEmail = exports.deletePendingRegistration = exports.findPendingRegistrationByVerificationCode = exports.upsertPendingRegistration = exports.createUser = void 0;
const db_1 = __importDefault(require("../config/db"));
const userProfileSelect = {
    id: true,
    email: true,
    pendingEmail: true,
    username: true,
    fullName: true,
    phoneNumber: true,
    age: true,
    bio: true,
    profileImage: true,
    role: true,
    isVerified: true,
    lastSeenAt: true,
    createdAt: true,
    deletedAt: true,
    deletionReason: true,
    skills: true
};
const createUser = (data) => {
    return db_1.default.user.create({ data });
};
exports.createUser = createUser;
const upsertPendingRegistration = (data) => {
    return db_1.default.pendingRegistration.upsert({
        where: { email: data.email },
        update: {
            fullName: data.fullName,
            password: data.password,
            verificationCode: data.verificationCode,
            verificationCodeExpires: data.verificationCodeExpires
        },
        create: data
    });
};
exports.upsertPendingRegistration = upsertPendingRegistration;
const findPendingRegistrationByVerificationCode = (hashedCode) => {
    return db_1.default.pendingRegistration.findFirst({
        where: { verificationCode: hashedCode }
    });
};
exports.findPendingRegistrationByVerificationCode = findPendingRegistrationByVerificationCode;
const deletePendingRegistration = (id) => {
    return db_1.default.pendingRegistration.delete({
        where: { id }
    });
};
exports.deletePendingRegistration = deletePendingRegistration;
const findUserByEmail = (email) => {
    return db_1.default.user.findFirst({
        where: {
            email,
            deletedAt: null
        }
    });
};
exports.findUserByEmail = findUserByEmail;
const findUserByPendingEmail = (pendingEmail) => {
    return db_1.default.user.findFirst({
        where: {
            pendingEmail,
            deletedAt: null
        }
    });
};
exports.findUserByPendingEmail = findUserByPendingEmail;
const findAnyUserByEmail = (email) => {
    return db_1.default.user.findUnique({ where: { email } });
};
exports.findAnyUserByEmail = findAnyUserByEmail;
const findUserByUsername = (username) => {
    return db_1.default.user.findFirst({
        where: {
            username,
            deletedAt: null
        }
    });
};
exports.findUserByUsername = findUserByUsername;
const findAnyUserByUsername = (username) => {
    return db_1.default.user.findUnique({ where: { username } });
};
exports.findAnyUserByUsername = findAnyUserByUsername;
const findUserByPhoneNumber = (phoneNumber) => {
    return db_1.default.user.findFirst({
        where: {
            phoneNumber,
            deletedAt: null
        }
    });
};
exports.findUserByPhoneNumber = findUserByPhoneNumber;
const findAnyUserByPhoneNumber = (phoneNumber) => {
    return db_1.default.user.findUnique({ where: { phoneNumber } });
};
exports.findAnyUserByPhoneNumber = findAnyUserByPhoneNumber;
const findUserById = (id) => {
    return db_1.default.user.findFirst({
        where: {
            id,
            deletedAt: null
        },
        select: userProfileSelect
    });
};
exports.findUserById = findUserById;
const findUserForAuthById = (id) => {
    return db_1.default.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            password: true,
            role: true,
            tokenVersion: true,
            refreshTokenHash: true,
            refreshTokenExpires: true,
            deletedAt: true,
            isVerified: true
        }
    });
};
exports.findUserForAuthById = findUserForAuthById;
const findUserByRefreshTokenHash = (refreshTokenHash) => {
    return db_1.default.user.findFirst({
        where: {
            refreshTokenHash,
            deletedAt: null
        },
        select: {
            id: true,
            role: true,
            tokenVersion: true,
            refreshTokenHash: true,
            refreshTokenExpires: true,
            deletedAt: true
        }
    });
};
exports.findUserByRefreshTokenHash = findUserByRefreshTokenHash;
const updateUser = (id, data) => {
    return db_1.default.user.update({
        where: { id },
        data,
        select: userProfileSelect
    });
};
exports.updateUser = updateUser;
const updateUserLastSeen = (id, lastSeenAt) => {
    const data = { lastSeenAt };
    const select = {
        id: true,
        lastSeenAt: true
    };
    return db_1.default.user.update({
        where: { id },
        data,
        select
    });
};
exports.updateUserLastSeen = updateUserLastSeen;
const findUserByVerificationCode = (hashedCode) => {
    return db_1.default.user.findFirst({
        where: {
            verificationCode: hashedCode,
            deletedAt: null,
        },
    });
};
exports.findUserByVerificationCode = findUserByVerificationCode;
const findUserByResetToken = (hashedToken) => {
    return db_1.default.user.findFirst({
        where: {
            resetPasswordToken: hashedToken,
            deletedAt: null,
        },
    });
};
exports.findUserByResetToken = findUserByResetToken;
const verifyUser = (id) => {
    return db_1.default.user.update({
        where: { id },
        data: {
            isVerified: true,
            pendingEmail: null,
            verificationCode: null,
            verificationCodeExpires: null
        },
        select: userProfileSelect
    });
};
exports.verifyUser = verifyUser;
const softDeleteUser = (id, deletionReason) => {
    return db_1.default.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            deletionReason: deletionReason !== null && deletionReason !== void 0 ? deletionReason : null,
            pendingEmail: null,
            verificationCode: null,
            verificationCodeExpires: null,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            refreshTokenHash: null,
            refreshTokenExpires: null,
            tokenVersion: {
                increment: 1
            }
        },
        select: userProfileSelect
    });
};
exports.softDeleteUser = softDeleteUser;
const restoreDeletedUser = (id) => {
    return db_1.default.user.update({
        where: { id },
        data: {
            deletedAt: null,
            deletionReason: null,
            refreshTokenHash: null,
            refreshTokenExpires: null,
            tokenVersion: {
                increment: 1
            }
        },
        select: {
            id: true,
            email: true,
            role: true,
            tokenVersion: true
        }
    });
};
exports.restoreDeletedUser = restoreDeletedUser;
