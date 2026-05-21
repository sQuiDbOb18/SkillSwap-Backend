"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPasswordResetTemplate = void 0;
const email_1 = require("../../config/email");
const layout_1 = require("./layout");
const buildPasswordResetTemplate = ({ name, code, }) => ({
    subject: `Reset your ${email_1.emailConfig.appName} password`,
    html: (0, layout_1.renderEmailLayout)({
        preheader: `Reset your ${email_1.emailConfig.appName} password securely.`,
        title: "Reset your password",
        intro: `Hi ${name},`,
        bodyHtml: `
      <p style="margin:0 0 16px;">We received a password reset request for your ${email_1.emailConfig.appName} account.</p>
      <p style="margin:0 0 16px;">Use the verification code below to continue. It expires in 15 minutes.</p>
      <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f766e;">${code}</p>
    `,
        secondaryNote: "If you did not request a password reset, you can safely ignore this email.",
    }),
    text: (0, layout_1.buildText)([
        `Hi ${name},`,
        "",
        `Use this code to reset your ${email_1.emailConfig.appName} password:`,
        code,
        "",
        "This reset code expires in 15 minutes.",
    ]),
});
exports.buildPasswordResetTemplate = buildPasswordResetTemplate;
