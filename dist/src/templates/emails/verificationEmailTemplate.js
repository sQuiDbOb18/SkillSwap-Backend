"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVerificationEmailTemplate = void 0;
const email_1 = require("../../config/email");
const layout_1 = require("./layout");
const buildVerificationEmailTemplate = ({ name, code, }) => ({
    subject: `Verify your ${email_1.emailConfig.appName} account`,
    html: (0, layout_1.renderEmailLayout)({
        preheader: `Verify your ${email_1.emailConfig.appName} account to get started.`,
        title: "Activate your account",
        intro: `Hi ${name}, welcome to ${email_1.emailConfig.appName}.`,
        bodyHtml: `
      <p style="margin:0 0 16px;">Thanks for signing up. Use the verification code below to activate your account.</p>
      <p style="margin:0 0 16px;">This code expires in 15 minutes.</p>
      <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f766e;">${code}</p>
    `,
        secondaryNote: "If you did not create this account, you can ignore this email.",
    }),
    text: (0, layout_1.buildText)([
        `Hi ${name},`,
        "",
        `Welcome to ${email_1.emailConfig.appName}. Use this code to verify your account:`,
        code,
        "",
        "This verification code expires in 15 minutes.",
    ]),
});
exports.buildVerificationEmailTemplate = buildVerificationEmailTemplate;
