"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmailChangeSuccessTemplate = void 0;
const email_1 = require("../../config/email");
const layout_1 = require("./layout");
const buildEmailChangeSuccessTemplate = ({ name, newEmail, actionUrl, }) => ({
    subject: `Your ${email_1.emailConfig.appName} email was updated`,
    html: (0, layout_1.renderEmailLayout)({
        preheader: "Your email address has been updated successfully.",
        title: "Email updated",
        intro: `Hi ${name},`,
        bodyHtml: `
      <p style="margin:0 0 16px;">Your ${email_1.emailConfig.appName} account email has been changed successfully.</p>
      <p style="margin:0;">Your new sign-in email is <strong>${newEmail}</strong>.</p>
    `,
        ctaLabel: "Open account",
        ctaUrl: actionUrl,
        secondaryNote: "If you did not make this change, secure your account immediately.",
    }),
    text: (0, layout_1.buildText)([
        `Hi ${name},`,
        "",
        `Your ${email_1.emailConfig.appName} account email was updated successfully.`,
        `New email: ${newEmail}`,
        "",
        "If you did not make this change, secure your account immediately.",
        actionUrl,
    ]),
});
exports.buildEmailChangeSuccessTemplate = buildEmailChangeSuccessTemplate;
