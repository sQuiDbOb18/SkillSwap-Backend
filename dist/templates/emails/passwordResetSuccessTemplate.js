"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPasswordResetSuccessTemplate = void 0;
const email_1 = require("../../config/email");
const layout_1 = require("./layout");
const buildPasswordResetSuccessTemplate = ({ name, actionUrl, }) => ({
    subject: `Your ${email_1.emailConfig.appName} password was reset`,
    html: (0, layout_1.renderEmailLayout)({
        preheader: "Your password has been reset successfully.",
        title: "Password updated",
        intro: `Hi ${name},`,
        bodyHtml: `
      <p style="margin:0 0 16px;">Your ${email_1.emailConfig.appName} password has been reset successfully.</p>
      <p style="margin:0;">You can now sign in with your new password.</p>
    `,
        ctaLabel: "Sign in",
        ctaUrl: actionUrl,
        secondaryNote: "If this was not you, reset your password again and contact support right away.",
    }),
    text: (0, layout_1.buildText)([
        `Hi ${name},`,
        "",
        `Your ${email_1.emailConfig.appName} password was reset successfully.`,
        "If this was not you, reset your password again and contact support right away.",
        actionUrl,
    ]),
});
exports.buildPasswordResetSuccessTemplate = buildPasswordResetSuccessTemplate;
