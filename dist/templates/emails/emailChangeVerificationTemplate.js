"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmailChangeVerificationTemplate = void 0;
const email_1 = require("../../config/email");
const layout_1 = require("./layout");
const buildEmailChangeVerificationTemplate = ({ name, code, }) => ({
    subject: `Confirm your new ${email_1.emailConfig.appName} email address`,
    html: (0, layout_1.renderEmailLayout)({
        preheader: "Confirm your new email address.",
        title: "Verify your new email",
        intro: `Hi ${name},`,
        bodyHtml: `
      <p style="margin:0 0 16px;">We received a request to change the email on your ${email_1.emailConfig.appName} account.</p>
      <p style="margin:0 0 16px;">Use the verification code below to confirm this new email address. It expires in 15 minutes.</p>
      <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f766e;">${code}</p>
    `,
        secondaryNote: "If you did not request this change, secure your account immediately.",
    }),
    text: (0, layout_1.buildText)([
        `Hi ${name},`,
        "",
        `Use this code to confirm your new email address for ${email_1.emailConfig.appName}:`,
        code,
        "",
        "This verification code expires in 15 minutes.",
    ]),
});
exports.buildEmailChangeVerificationTemplate = buildEmailChangeVerificationTemplate;
