import { Resend } from "resend";
import { emailConfig } from "../config/email";
import { CustomError } from "../utils/CustomError";
import { buildEmailChangeVerificationTemplate } from "../templates/emails/emailChangeVerificationTemplate";
import { buildEmailChangeSuccessTemplate } from "../templates/emails/emailChangeSuccessTemplate";
import { buildPasswordResetTemplate } from "../templates/emails/passwordResetTemplate";
import { buildPasswordResetSuccessTemplate } from "../templates/emails/passwordResetSuccessTemplate";
import { buildSwapRequestAcceptedTemplate } from "../templates/emails/swapRequestAcceptedTemplate";
import { buildSwapRequestReceivedTemplate } from "../templates/emails/swapRequestReceivedTemplate";
import { buildVerificationEmailTemplate } from "../templates/emails/verificationEmailTemplate";
import { buildWelcomeEmailTemplate } from "../templates/emails/welcomeEmailTemplate";
import { EmailTemplateResult } from "../templates/emails/types";

type BaseEmailInput = {
  email: string;
  name: string;
};

type CodeEmailInput = BaseEmailInput & {
  code: string;
};

type HostedTemplateKey =
  | "verification"
  | "emailChangeVerification"
  | "emailChangeSuccess"
  | "passwordReset"
  | "passwordResetSuccess"
  | "swapRequestReceived"
  | "swapRequestAccepted"
  | "welcome";

type HostedTemplateConfig = {
  id: string;
  variables: Record<string, string>;
};

type ActionEmailInput = BaseEmailInput & {
  actionUrl: string;
};

type SwapNotificationInput = BaseEmailInput & {
  otherUserName: string;
  requestedSkillTitle: string;
  offeredSkillTitle: string;
  actionUrl: string;
};

const getResendClient = () => {
  if (!emailConfig.resend.apiKey) {
    throw new CustomError("RESEND_API_KEY is missing. Email service is not configured.", 500);
  }

  return new Resend(emailConfig.resend.apiKey);
};

const getSender = () => {
  const fromEmail = emailConfig.resend.fromEmail;
  const fromName = emailConfig.resend.fromName;

  if (!fromEmail) {
    throw new CustomError(
      "RESEND_FROM_EMAIL is missing. Email service is not configured.",
      500
    );
  }

  return `${fromName} <${fromEmail}>`;
};

const buildHostedTemplate = (
  key: HostedTemplateKey,
  input: BaseEmailInput & { actionUrl?: string; code?: string }
): HostedTemplateConfig | undefined => {
  const templateId = emailConfig.resend.templates[key];

  if (!templateId) {
    return undefined;
  }

  return {
    id: templateId,
    variables: {
      APP_NAME: emailConfig.appName,
      FIRST_NAME: input.name,
      FULL_NAME: input.name,
      SUPPORT_EMAIL: emailConfig.supportEmail,
      ACTION_URL: input.actionUrl ?? "",
      CODE: input.code ?? "",
      HOME_URL: emailConfig.appHomeUrl,
    },
  };
};

const sendEmail = async ({
  toEmail,
  toName,
  template,
  hostedTemplate,
}: {
  toEmail: string;
  toName: string;
  template: EmailTemplateResult;
  hostedTemplate?: HostedTemplateConfig;
}) => {
  const resend = getResendClient();
  const from = getSender();
  const replyTo = emailConfig.resend.replyTo;
  const emailPayload = {
    from,
    to: [toEmail],
    subject: template.subject,
    ...(replyTo ? { replyTo } : {}),
    ...(hostedTemplate
      ? {
          template: {
            id: hostedTemplate.id,
            variables: hostedTemplate.variables,
          },
        }
      : {
          html: template.html,
          text: template.text,
        }),
  };

  try {
    const { error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error("Failed to send email with Resend:", error);
      throw new CustomError("We could not send the email right now. Please try again shortly.", 500);
    }
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    console.error("Failed to send email with Resend:", error);
    throw new CustomError("We could not send the email right now. Please try again shortly.", 500);
  }
};

export const sendVerificationEmail = async ({
  email,
  name,
  code,
}: CodeEmailInput) => {
  const template = buildVerificationEmailTemplate({
    name,
    code,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("verification", {
      email,
      name,
      code,
    }),
  });
};

export const sendEmailChangeVerificationEmail = async ({
  email,
  name,
  code,
}: CodeEmailInput) => {
  const template = buildEmailChangeVerificationTemplate({
    name,
    code,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("emailChangeVerification", {
      email,
      name,
      actionUrl: emailConfig.verifyEmailChangeActionUrl(code),
    }),
  });
};

export const sendPasswordResetEmail = async ({ email, name, code }: CodeEmailInput) => {
  const template = buildPasswordResetTemplate({
    name,
    code,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("passwordReset", {
      email,
      name,
      actionUrl: emailConfig.resetPasswordPageUrl(code),
    }),
  });
};

export const sendWelcomeEmail = async ({ email, name }: BaseEmailInput) => {
  const template = buildWelcomeEmailTemplate({
    name,
    actionUrl: emailConfig.appHomeUrl,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("welcome", {
      email,
      name,
      actionUrl: emailConfig.appHomeUrl,
    }),
  });
};

export const sendEmailChangeSuccessEmail = async ({
  email,
  name,
  actionUrl,
}: ActionEmailInput) => {
  const template = buildEmailChangeSuccessTemplate({
    name,
    newEmail: email,
    actionUrl,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("emailChangeSuccess", {
      email,
      name,
      actionUrl,
    }),
  });
};

export const sendPasswordResetSuccessEmail = async ({
  email,
  name,
  actionUrl,
}: ActionEmailInput) => {
  const template = buildPasswordResetSuccessTemplate({
    name,
    actionUrl,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("passwordResetSuccess", {
      email,
      name,
      actionUrl,
    }),
  });
};

export const sendSwapRequestReceivedEmail = async ({
  email,
  name,
  otherUserName,
  requestedSkillTitle,
  offeredSkillTitle,
  actionUrl,
}: SwapNotificationInput) => {
  const template = buildSwapRequestReceivedTemplate({
    name,
    requesterName: otherUserName,
    requestedSkillTitle,
    offeredSkillTitle,
    actionUrl,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("swapRequestReceived", {
      email,
      name,
      actionUrl,
    }),
  });
};

export const sendSwapRequestAcceptedEmail = async ({
  email,
  name,
  otherUserName,
  requestedSkillTitle,
  offeredSkillTitle,
  actionUrl,
}: SwapNotificationInput) => {
  const template = buildSwapRequestAcceptedTemplate({
    name,
    accepterName: otherUserName,
    requestedSkillTitle,
    offeredSkillTitle,
    actionUrl,
  });

  await sendEmail({
    toEmail: email,
    toName: name,
    template,
    hostedTemplate: buildHostedTemplate("swapRequestAccepted", {
      email,
      name,
      actionUrl,
    }),
  });
};
