import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type VerificationEmailTemplateInput = {
  name: string;
  code: string;
};

export const buildVerificationEmailTemplate = ({
  name,
  code,
}: VerificationEmailTemplateInput): EmailTemplateResult => ({
  subject: `Verify your ${emailConfig.appName} account`,
  html: renderEmailLayout({
    preheader: `Verify your ${emailConfig.appName} account to get started.`,
    title: "Activate your account",
    intro: `Hi ${name}, welcome to ${emailConfig.appName}.`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Thanks for signing up. Use the verification code below to activate your account.</p>
      <p style="margin:0 0 16px;">This code expires in 15 minutes.</p>
      <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f766e;">${code}</p>
    `,
    secondaryNote: "If you did not create this account, you can ignore this email.",
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `Welcome to ${emailConfig.appName}. Use this code to verify your account:`,
    code,
    "",
    "This verification code expires in 15 minutes.",
  ]),
});
