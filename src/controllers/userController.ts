import { asyncHandler } from "../utils/asyncHandler";
import { emailConfig } from "../config/email";
import { setRefreshTokenCookie } from "../utils/refreshTokenCookie";
import { 
    getUserProfile, 
    updateUserProfile, 
    changePassword,
    changeEmail, 
    verifyNewEmail,
    forgotPassword, 
    verifyResetPasswordCode,
    resetPassword,
    deleteAccount,
    restoreAccount
} from "../services/userService";

export const getProfile = asyncHandler(async (req: any, res: any) => {
  const user = await getUserProfile(req.user.userId);
  res.json(user);
});

export const updateProfile = asyncHandler(async (req: any, res: any) => {
  const updated = await updateUserProfile(req.user.userId, req.body);
  res.json(updated);
});

export const changePasswordController = asyncHandler(async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;

  const result = await changePassword(
    req.user.userId,
    currentPassword,
    newPassword
  );

  res.json(result);
});

export const changeEmailController = asyncHandler(async (req: any, res: any) => {
  const { email } = req.body;

  const result = await changeEmail(req.user.userId, email);

  res.json(result);
});

export const verifyEmailChange = asyncHandler(async (req: any, res: any) => {
  const { code } = req.body;

  const result = await verifyNewEmail(code);

  res.json(result);
});

export const verifyEmailChangeRedirect = asyncHandler(async (req: any, res: any) => {
  const code = String(req.query.token ?? "");

  try {
    await verifyNewEmail(code);
    res.redirect(emailConfig.verifyEmailChangeSuccessRedirect("Email verified successfully"));
  } catch (error: any) {
    const message = error?.message ?? "Email verification failed";
    res.redirect(emailConfig.verifyEmailChangeFailureRedirect(message));
  }
});

export const forgotPasswordController = asyncHandler(async (req: any, res: any) => {
  const { email } = req.body;

  const result = await forgotPassword(email);

  res.json(result);
});

export const resetPasswordController = asyncHandler(async (req: any, res: any) => {
  const { code, newPassword } = req.body;

  const result = await resetPassword(code, newPassword);

  res.json(result);

});

export const verifyResetPasswordCodeController = asyncHandler(async (req: any, res: any) => {
  const { code } = req.body;

  const result = await verifyResetPasswordCode(code);

  res.json(result);
});

export const deleteAccountController = asyncHandler(async (req: any, res: any) => {
  const result = await deleteAccount(req.user.userId, req.body);
  res.json(result);
});

export const restoreAccountController = asyncHandler(async (req: any, res: any) => {
  const result = await restoreAccount(req.body);
  setRefreshTokenCookie(res, result.refreshToken);
  res.json(result);
});
