import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type PasswordResetTemplateInput = {
  name: string;
  code: string;
};

export const buildPasswordResetTemplate = ({
  name,
  code,
}: PasswordResetTemplateInput): EmailTemplateResult => ({
  subject: `Reset your ${emailConfig.appName} password`,
  html: renderEmailLayout({
    preheader: `Reset your ${emailConfig.appName} password securely.`,
    title: "Reset your password",
    intro: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 16px;">We received a password reset request for your ${emailConfig.appName} account.</p>
      <p style="margin:0 0 16px;">Use the verification code below to continue. It expires in 15 minutes.</p>
      <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f766e;">${code}</p>
    `,
    secondaryNote: "If you did not request a password reset, you can safely ignore this email.",
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `Use this code to reset your ${emailConfig.appName} password:`,
    code,
    "",
    "This reset code expires in 15 minutes.",
  ]),
});
