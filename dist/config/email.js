"use strict";
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailConfig = void 0;
const clientUrl = (_a = process.env.CLIENT_URL) !== null && _a !== void 0 ? _a : "http://localhost:3000";
const apiUrl = (_b = process.env.API_URL) !== null && _b !== void 0 ? _b : "http://localhost:4000";
const appName = (_c = process.env.APP_NAME) !== null && _c !== void 0 ? _c : "SkillSwap";
const optionalEnv = (value) => {
    const trimmed = value === null || value === void 0 ? void 0 : value.trim();
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
    supportEmail: (_g = (_f = (_e = (_d = process.env.SUPPORT_EMAIL) !== null && _d !== void 0 ? _d : optionalEnv(process.env.RESEND_REPLY_TO)) !== null && _e !== void 0 ? _e : optionalEnv(process.env.RESEND_FROM_EMAIL)) !== null && _f !== void 0 ? _f : process.env.MAIL_FROM_EMAIL) !== null && _g !== void 0 ? _g : "support@skillswap.com",
    resend: {
        apiKey: optionalEnv(process.env.RESEND_API_KEY),
        fromEmail: (_h = optionalEnv(process.env.RESEND_FROM_EMAIL)) !== null && _h !== void 0 ? _h : optionalEnv(process.env.MAIL_FROM_EMAIL),
        fromName: (_k = (_j = optionalEnv(process.env.RESEND_FROM_NAME)) !== null && _j !== void 0 ? _j : optionalEnv(process.env.MAIL_FROM_NAME)) !== null && _k !== void 0 ? _k : appName,
        replyTo: (_m = (_l = optionalEnv(process.env.RESEND_REPLY_TO)) !== null && _l !== void 0 ? _l : optionalEnv(process.env.RESEND_FROM_EMAIL)) !== null && _m !== void 0 ? _m : optionalEnv(process.env.MAIL_FROM_EMAIL),
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
    verifyAccountActionUrl: (token) => {
        var _a;
        return withToken((_a = process.env.VERIFY_ACCOUNT_URL) !== null && _a !== void 0 ? _a : `${apiUrl}/api/auth/verify-email`, token);
    },
    verifyEmailChangeActionUrl: (token) => {
        var _a;
        return withToken((_a = process.env.VERIFY_EMAIL_CHANGE_URL) !== null && _a !== void 0 ? _a : `${apiUrl}/api/user/verify-email`, token);
    },
    resetPasswordPageUrl: (token) => {
        var _a;
        return withToken((_a = process.env.RESET_PASSWORD_URL) !== null && _a !== void 0 ? _a : `${clientUrl}/reset-password`, token);
    },
    bookingsPageUrl: (_o = process.env.BOOKINGS_PAGE_URL) !== null && _o !== void 0 ? _o : `${clientUrl}/bookings`,
    signInPageUrl: (_p = process.env.SIGN_IN_URL) !== null && _p !== void 0 ? _p : `${clientUrl}/login`,
    appHomeUrl: (_q = process.env.APP_HOME_URL) !== null && _q !== void 0 ? _q : clientUrl,
    verifyAccountSuccessRedirect: (message) => {
        var _a;
        return withStatus((_a = process.env.VERIFY_ACCOUNT_SUCCESS_URL) !== null && _a !== void 0 ? _a : `${clientUrl}/auth/verified`, "success", message);
    },
    verifyAccountFailureRedirect: (message) => {
        var _a;
        return withStatus((_a = process.env.VERIFY_ACCOUNT_FAILURE_URL) !== null && _a !== void 0 ? _a : `${clientUrl}/auth/verified`, "error", message);
    },
    verifyEmailChangeSuccessRedirect: (message) => {
        var _a;
        return withStatus((_a = process.env.VERIFY_EMAIL_CHANGE_SUCCESS_URL) !== null && _a !== void 0 ? _a : `${clientUrl}/settings/email-verified`, "success", message);
    },
    verifyEmailChangeFailureRedirect: (message) => {
        var _a;
        return withStatus((_a = process.env.VERIFY_EMAIL_CHANGE_FAILURE_URL) !== null && _a !== void 0 ? _a : `${clientUrl}/settings/email-verified`, "error", message);
    },
};
