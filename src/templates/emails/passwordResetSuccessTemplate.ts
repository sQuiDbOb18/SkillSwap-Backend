import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type PasswordResetSuccessTemplateInput = {
  name: string;
  actionUrl: string;
};

export const buildPasswordResetSuccessTemplate = ({
  name,
  actionUrl,
}: PasswordResetSuccessTemplateInput): EmailTemplateResult => ({
  subject: `Your ${emailConfig.appName} password was reset`,
  html: renderEmailLayout({
    preheader: "Your password has been reset successfully.",
    title: "Password updated",
    intro: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Your ${emailConfig.appName} password has been reset successfully.</p>
      <p style="margin:0;">You can now sign in with your new password.</p>
    `,
    ctaLabel: "Sign in",
    ctaUrl: actionUrl,
    secondaryNote: "If this was not you, reset your password again and contact support right away.",
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `Your ${emailConfig.appName} password was reset successfully.`,
    "If this was not you, reset your password again and contact support right away.",
    actionUrl,
  ]),
});
