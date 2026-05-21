"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWelcomeEmailTemplate = void 0;
const email_1 = require("../../config/email");
const layout_1 = require("./layout");
const buildWelcomeEmailTemplate = ({ name, actionUrl, }) => ({
    subject: `Welcome to ${email_1.emailConfig.appName}`,
    html: (0, layout_1.renderEmailLayout)({
        preheader: `Your ${email_1.emailConfig.appName} account is ready.`,
        title: "You are all set",
        intro: `Hi ${name},`,
        bodyHtml: `
      <p style="margin:0 0 16px;">Your email has been verified and your ${email_1.emailConfig.appName} account is now active.</p>
      <p style="margin:0;">You can sign in, complete your profile, and start connecting with people right away.</p>
    `,
        ctaLabel: "Open app",
        ctaUrl: actionUrl,
    }),
    text: (0, layout_1.buildText)([
        `Hi ${name},`,
        "",
        `Welcome to ${email_1.emailConfig.appName}. Your account is verified and ready to use.`,
        actionUrl,
    ]),
});
exports.buildWelcomeEmailTemplate = buildWelcomeEmailTemplate;
