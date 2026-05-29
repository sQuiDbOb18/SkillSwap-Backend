import { env } from "./env";

const clientUrl = env.CLIENT_URL;
const apiUrl = env.API_URL;
const appName = env.APP_NAME;

const optionalEnv = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const withToken = (baseUrl: string, token: string) => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};

const withStatus = (baseUrl: string, status: "success" | "error", message: string) => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}status=${encodeURIComponent(status)}&message=${encodeURIComponent(
    message
  )}`;
};

export const emailConfig = {
  appName,
  clientUrl,
  apiUrl,
  supportEmail:
    env.SUPPORT_EMAIL ??
    optionalEnv(env.RESEND_REPLY_TO) ??
    optionalEnv(env.RESEND_FROM_EMAIL) ??
    env.MAIL_FROM_EMAIL ??
    "support@skillswap.com",
  resend: {
    apiKey: optionalEnv(env.RESEND_API_KEY),
    fromEmail:
      optionalEnv(env.RESEND_FROM_EMAIL) ??
      optionalEnv(env.MAIL_FROM_EMAIL),
    fromName:
      optionalEnv(env.RESEND_FROM_NAME) ??
      optionalEnv(env.MAIL_FROM_NAME) ??
      appName,
    replyTo:
      optionalEnv(env.RESEND_REPLY_TO) ??
      optionalEnv(env.RESEND_FROM_EMAIL) ??
      optionalEnv(env.MAIL_FROM_EMAIL),
    templates: {
      verification: optionalEnv(process.env.RESEND_TEMPLATE_VERIFICATION_ID),
      emailChangeVerification: optionalEnv(process.env.RESEND_TEMPLATE_EMAIL_CHANGE_ID),
      emailChangeSuccess: optionalEnv(process.env.RESEND_TEMPLATE_EMAIL_CHANGE_SUCCESS_ID),
      passwordReset: optionalEnv(process.env.RESEND_TEMPLATE_PASSWORD_RESET_ID),
      passwordResetSuccess: optionalEnv(process.env.RESEND_TEMPLATE_PASSWORD_RESET_SUCCESS_ID),
      swapRequestReceived: optionalEnv(process.env.RESEND_TEMPLATE_SWAP_REQUEST_RECEIVED_ID),
      swapRequestAccepted: optionalEnv(process.env.RESEND_TEMPLATE_SWAP_REQUEST_ACCEPTED_ID),
      welcome: optionalEnv(process.env.RESEND_TEMPLATE_WELCOME_ID),
    },
  },
  verifyAccountActionUrl: (token: string) =>
    withToken(
      env.VERIFY_ACCOUNT_URL ?? `${apiUrl}/api/auth/verify-email`,
      token
    ),
  verifyEmailChangeActionUrl: (token: string) =>
    withToken(
      env.VERIFY_EMAIL_CHANGE_URL ?? `${apiUrl}/api/user/verify-email`,
      token
    ),
  resetPasswordPageUrl: (token: string) =>
    withToken(
      env.RESET_PASSWORD_URL ?? `${clientUrl}/reset-password`,
      token
    ),
  bookingsPageUrl: env.BOOKINGS_PAGE_URL ?? `${clientUrl}/bookings`,
  signInPageUrl: env.SIGN_IN_URL ?? `${clientUrl}/login`,
  appHomeUrl: env.APP_HOME_URL ?? clientUrl,
  verifyAccountSuccessRedirect: (message: string) =>
    withStatus(
      env.VERIFY_ACCOUNT_SUCCESS_URL ?? `${clientUrl}/auth/verified`,
      "success",
      message
    ),
  verifyAccountFailureRedirect: (message: string) =>
    withStatus(
      env.VERIFY_ACCOUNT_FAILURE_URL ?? `${clientUrl}/auth/verified`,
      "error",
      message
    ),
  verifyEmailChangeSuccessRedirect: (message: string) =>
    withStatus(
      env.VERIFY_EMAIL_CHANGE_SUCCESS_URL ?? `${clientUrl}/settings/email-verified`,
      "success",
      message
    ),
  verifyEmailChangeFailureRedirect: (message: string) =>
    withStatus(
      env.VERIFY_EMAIL_CHANGE_FAILURE_URL ?? `${clientUrl}/settings/email-verified`,
      "error",
      message
    ),
};
