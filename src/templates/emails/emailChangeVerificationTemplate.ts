import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type EmailChangeVerificationTemplateInput = {
  name: string;
  code: string;
};

export const buildEmailChangeVerificationTemplate = ({
  name,
  code,
}: EmailChangeVerificationTemplateInput): EmailTemplateResult => ({
  subject: `Confirm your new ${emailConfig.appName} email address`,
  html: renderEmailLayout({
    preheader: "Confirm your new email address.",
    title: "Verify your new email",
    intro: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 16px;">We received a request to change the email on your ${emailConfig.appName} account.</p>
      <p style="margin:0 0 16px;">Use the verification code below to confirm this new email address. It expires in 15 minutes.</p>
      <p style="margin:0;font-size:32px;letter-spacing:8px;font-weight:700;color:#0f766e;">${code}</p>
    `,
    secondaryNote: "If you did not request this change, secure your account immediately.",
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `Use this code to confirm your new email address for ${emailConfig.appName}:`,
    code,
    "",
    "This verification code expires in 15 minutes.",
  ]),
});
