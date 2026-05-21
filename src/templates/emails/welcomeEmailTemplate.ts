import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type WelcomeEmailTemplateInput = {
  name: string;
  actionUrl: string;
};

export const buildWelcomeEmailTemplate = ({
  name,
  actionUrl,
}: WelcomeEmailTemplateInput): EmailTemplateResult => ({
  subject: `Welcome to ${emailConfig.appName}`,
  html: renderEmailLayout({
    preheader: `Your ${emailConfig.appName} account is ready.`,
    title: "You are all set",
    intro: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 16px;">Your email has been verified and your ${emailConfig.appName} account is now active.</p>
      <p style="margin:0;">You can sign in, complete your profile, and start connecting with people right away.</p>
    `,
    ctaLabel: "Open app",
    ctaUrl: actionUrl,
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `Welcome to ${emailConfig.appName}. Your account is verified and ready to use.`,
    actionUrl,
  ]),
});
