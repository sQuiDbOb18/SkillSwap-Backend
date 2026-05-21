import { emailConfig } from "../config/email";
import { CustomError } from "../utils/CustomError";
import {
  findAnyUserByEmail,
  findUserById,
  getUserSessionStats,
  updateUser,
  findUserByResetToken,
  findUserByEmail,
  findUserByPendingEmail,
  findUserByVerificationCode,
  softDeleteUser,
  restoreDeletedUser
} from "../repositories/userRepository";
import { hashPassword, comparePassword } from "../utils/hash";
import { generateEmailCode, generateVerificationCode, hashCode } from "../utils/generateCode";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import {
  sendEmailChangeSuccessEmail,
  sendEmailChangeVerificationEmail,
  sendPasswordResetSuccessEmail,
  sendPasswordResetEmail
} from "./emailService";
import { z } from "zod"
import {
  updateProfileSchema,
  deleteAccountSchema,
  restoreAccountSchema
} from "../validations/userValidation";

export const getUserProfile = async (userId: string) => {
    const user = await findUserById(userId)
    if (!user) {
        throw new CustomError("User not found", 404)
    }
    const sessionStats = await getUserSessionStats(userId)

    return {
      ...user,
      sessionStats
    }
}

type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export const updateUserProfile = async (userId: string, data: UpdateProfileInput) => {
    return await updateUser(userId, data)
}

const fieldError = (field: string, message: string, statusCode = 400) =>
  new CustomError(message, statusCode, {
    type: "VALIDATION_ERROR",
    errors: [{ field, message }],
  });

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    const user = await findUserById(userId)
    if (!user) {
        throw new CustomError("User not found", 404)
    }   
    const userWithPassword = await findAnyUserByEmail(user.email)
    if (!userWithPassword) {
        throw new CustomError("User not found", 404)
    }

    const isMatch = await comparePassword(currentPassword, userWithPassword.password)
    if (!isMatch) {
        throw fieldError("currentPassword", "Current password is incorrect")
    }
    const samePassword = await comparePassword(newPassword, userWithPassword.password)
    if (samePassword) {
        throw fieldError("newPassword", "New password cannot be the same as the current password")
    }
    const hashedPassword = await hashPassword(newPassword)
    return await updateUser(userId, {
      password: hashedPassword,
      refreshTokenHash: null,
      refreshTokenExpires: null,
      tokenVersion: {
        increment: 1
      }
    })
}

export const changeEmail = async (userId: string, newEmail: string) => {
    const user = await findUserById(userId)
    if (!user) {
      throw new CustomError("User not found", 404)
    }

    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      throw fieldError("email", "Please enter a different email address")
    }

    const existingUser = await findAnyUserByEmail(newEmail)
    if (existingUser && existingUser.id !== userId) {
      if (existingUser.deletedAt) {
        throw fieldError("email", "Email belongs to a deleted account and cannot be reused until restored.")
      }
      throw fieldError("email", "Email already exists")
    }

    const existingPendingEmail = await findUserByPendingEmail(newEmail)
    if (existingPendingEmail && existingPendingEmail.id !== userId) {
      throw fieldError("email", "That email is already being verified by another account")
    }

    const { rawCode, hashedCode } = generateVerificationCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    const updatedUser = await updateUser(userId, {
      pendingEmail: newEmail,
      verificationCode: hashedCode,
      verificationCodeExpires: expires,
    });

    await sendEmailChangeVerificationEmail({
      email: newEmail,
      name: updatedUser.fullName,
      code: rawCode
    });

    return { message: "Verification code sent to your new email address" };
};

export const verifyNewEmail = async (code: string) => {
    const user = await findUserByVerificationCode(hashCode(code));
    if (!user) {
        throw fieldError("code", "The verification code is incorrect");
    }
    if (user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
        throw fieldError("code", "This verification code has expired. Request a new one.");
    }
    if (!user.pendingEmail) {
        throw fieldError("code", "There is no email change request to verify");
    }

    const existingUser = await findAnyUserByEmail(user.pendingEmail);
    if (existingUser && existingUser.id !== user.id) {
        throw fieldError("email", "That email address is no longer available");
    }

    const updatedUser = await updateUser(user.id, {
      email: user.pendingEmail,
      pendingEmail: null,
      isVerified: true,
      verificationCode: null,
      verificationCodeExpires: null
    });

    await sendEmailChangeSuccessEmail({
      email: updatedUser.email,
      name: updatedUser.fullName,
      actionUrl: emailConfig.appHomeUrl,
    });

    return updatedUser;
}


export const forgotPassword = async (email: string) => {
    const user = await findUserByEmail(email);
    if (!user) {
      throw fieldError("email", "No account was found with that email address", 404);
    }

    const { rawCode, hashedCode } = generateEmailCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); 

    await updateUser(user.id, {
      resetPasswordToken: hashedCode,
      resetPasswordExpires: expires,
    });

    await sendPasswordResetEmail({
      email: user.email,
      name: user.fullName,
      code: rawCode
    });

    return { message: "Password reset code sent" };
};

export const resetPassword = async (code: string, newPassword: string) => {
    const user = await findUserByResetToken(hashCode(code));
    if (!user) {
      throw fieldError("code", "The reset code is incorrect");
    }
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw fieldError("code", "This reset code has expired. Request a new one.");
    }
    
    const samePassword = await comparePassword(newPassword, user.password);
    if (samePassword) {
      throw fieldError("newPassword", "New password cannot be the same as your current password");
    }

    const hashedPassword = await hashPassword(newPassword);

    await updateUser(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshTokenHash: null,
      refreshTokenExpires: null,
      tokenVersion: {
        increment: 1
      }
    });

    await sendPasswordResetSuccessEmail({
      email: user.email,
      name: user.fullName,
      actionUrl: emailConfig.signInPageUrl,
    });

    return { message: "Password reset successful" };
};

export const verifyResetPasswordCode = async (code: string) => {
    const user = await findUserByResetToken(hashCode(code));
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

type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
export const deleteAccount = async (userId: string, data: DeleteAccountInput) => {
    const user = await findUserById(userId)
    if (!user) {
      throw new CustomError("User not found", 404)
    }

    const userWithPassword = await findAnyUserByEmail(user.email)
    if (!userWithPassword) {
      throw new CustomError("User not found", 404)
    }

    const isMatch = await comparePassword(data.password, userWithPassword.password)
    if (!isMatch) {
      throw fieldError("password", "Password is incorrect")
    }

    await softDeleteUser(userId, data.reason)

    return {
      message: "Account deleted successfully. You can restore it later with your email and password."
    }
}

type RestoreAccountInput = z.infer<typeof restoreAccountSchema>
export const restoreAccount = async (data: RestoreAccountInput) => {
    const user = await findAnyUserByEmail(data.email)
    if (!user || !user.deletedAt) {
      throw new CustomError("Deleted account not found", 404)
    }

    const isMatch = await comparePassword(data.password, user.password)
    if (!isMatch) {
      throw fieldError("password", "Password is incorrect", 401)
    }

    const restoredUser = await restoreDeletedUser(user.id)
    const accessToken = generateAccessToken(restoredUser.id, restoredUser.role, restoredUser.tokenVersion)
    const refreshToken = generateRefreshToken(restoredUser.id, restoredUser.tokenVersion)

    await updateUser(restoredUser.id, {
      refreshTokenHash: hashCode(refreshToken),
      refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    return {
      message: "Account restored successfully",
      accessToken,
      refreshToken
    }
}
