"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailConfig = void 0;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
const apiUrl = process.env.API_URL ?? "http://localhost:4000";
const appName = process.env.APP_NAME ?? "SkillSwap";
const optionalEnv = (value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
};
const withToken = (baseUrl, token) => {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};
const withStatus = (baseUrl, status, message) => {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}status=${encodeURIComponent(status)}&message=${encodeURIComponent(message)}`;
};
exports.emailConfig = {
    appName,
    clientUrl,
    apiUrl,
    supportEmail: process.env.SUPPORT_EMAIL ??
        optionalEnv(process.env.RESEND_REPLY_TO) ??
        optionalEnv(process.env.RESEND_FROM_EMAIL) ??
        process.env.MAIL_FROM_EMAIL ??
        "support@skillswap.com",
    resend: {
        apiKey: optionalEnv(process.env.RESEND_API_KEY),
        fromEmail: optionalEnv(process.env.RESEND_FROM_EMAIL) ??
            optionalEnv(process.env.MAIL_FROM_EMAIL),
        fromName: optionalEnv(process.env.RESEND_FROM_NAME) ??
            optionalEnv(process.env.MAIL_FROM_NAME) ??
            appName,
        replyTo: optionalEnv(process.env.RESEND_REPLY_TO) ??
            optionalEnv(process.env.RESEND_FROM_EMAIL) ??
            optionalEnv(process.env.MAIL_FROM_EMAIL),
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
    verifyAccountActionUrl: (token) => withToken(process.env.VERIFY_ACCOUNT_URL ?? `${apiUrl}/api/auth/verify-email`, token),
    verifyEmailChangeActionUrl: (token) => withToken(process.env.VERIFY_EMAIL_CHANGE_URL ?? `${apiUrl}/api/user/verify-email`, token),
    resetPasswordPageUrl: (token) => withToken(process.env.RESET_PASSWORD_URL ?? `${clientUrl}/reset-password`, token),
    bookingsPageUrl: process.env.BOOKINGS_PAGE_URL ?? `${clientUrl}/bookings`,
    signInPageUrl: process.env.SIGN_IN_URL ?? `${clientUrl}/login`,
    appHomeUrl: process.env.APP_HOME_URL ?? clientUrl,
    verifyAccountSuccessRedirect: (message) => withStatus(process.env.VERIFY_ACCOUNT_SUCCESS_URL ?? `${clientUrl}/auth/verified`, "success", message),
    verifyAccountFailureRedirect: (message) => withStatus(process.env.VERIFY_ACCOUNT_FAILURE_URL ?? `${clientUrl}/auth/verified`, "error", message),
    verifyEmailChangeSuccessRedirect: (message) => withStatus(process.env.VERIFY_EMAIL_CHANGE_SUCCESS_URL ?? `${clientUrl}/settings/email-verified`, "success", message),
    verifyEmailChangeFailureRedirect: (message) => withStatus(process.env.VERIFY_EMAIL_CHANGE_FAILURE_URL ?? `${clientUrl}/settings/email-verified`, "error", message),
};
