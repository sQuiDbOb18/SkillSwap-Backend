import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type EmailChangeSuccessTemplateInput = {
  name: string;
  newEmail: string;
  actionUrl: string;
};

export const buildEmailChangeSuccessTemplate = ({
  name,
  newEmail,
  actionUrl,
}: EmailChangeSuccessTemplateInput): EmailTemplateResult => ({
  subject: `Your ${emailConfig.appName} email was updated`,
  html: renderEmailLayout({
    preheader: "Your email address has been updated successfully.",
    title: "Email updated",
    intro: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Your ${emailConfig.appName} account email has been changed successfully.</p>
      <p style="margin:0;">Your new sign-in email is <strong>${newEmail}</strong>.</p>
    `,
    ctaLabel: "Open account",
    ctaUrl: actionUrl,
    secondaryNote: "If you did not make this change, secure your account immediately.",
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `Your ${emailConfig.appName} account email was updated successfully.`,
    `New email: ${newEmail}`,
    "",
    "If you did not make this change, secure your account immediately.",
    actionUrl,
  ]),
});
