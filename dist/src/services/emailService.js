"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSwapRequestAcceptedEmail = exports.sendSwapRequestReceivedEmail = exports.sendPasswordResetSuccessEmail = exports.sendEmailChangeSuccessEmail = exports.sendWelcomeEmail = exports.sendPasswordResetEmail = exports.sendEmailChangeVerificationEmail = exports.sendVerificationEmail = void 0;
const resend_1 = require("resend");
const email_1 = require("../config/email");
const CustomError_1 = require("../utils/CustomError");
const emailChangeVerificationTemplate_1 = require("../templates/emails/emailChangeVerificationTemplate");
const emailChangeSuccessTemplate_1 = require("../templates/emails/emailChangeSuccessTemplate");
const passwordResetTemplate_1 = require("../templates/emails/passwordResetTemplate");
const passwordResetSuccessTemplate_1 = require("../templates/emails/passwordResetSuccessTemplate");
const swapRequestAcceptedTemplate_1 = require("../templates/emails/swapRequestAcceptedTemplate");
const swapRequestReceivedTemplate_1 = require("../templates/emails/swapRequestReceivedTemplate");
const verificationEmailTemplate_1 = require("../templates/emails/verificationEmailTemplate");
const welcomeEmailTemplate_1 = require("../templates/emails/welcomeEmailTemplate");
const getResendClient = () => {
    if (!email_1.emailConfig.resend.apiKey) {
        throw new CustomError_1.CustomError("RESEND_API_KEY is missing. Email service is not configured.", 500);
    }
    return new resend_1.Resend(email_1.emailConfig.resend.apiKey);
};
const getSender = () => {
    const fromEmail = email_1.emailConfig.resend.fromEmail;
    const fromName = email_1.emailConfig.resend.fromName;
    if (!fromEmail) {
        throw new CustomError_1.CustomError("RESEND_FROM_EMAIL is missing. Email service is not configured.", 500);
    }
    return `${fromName} <${fromEmail}>`;
};
const buildHostedTemplate = (key, input) => {
    const templateId = email_1.emailConfig.resend.templates[key];
    if (!templateId) {
        return undefined;
    }
    return {
        id: templateId,
        variables: {
            APP_NAME: email_1.emailConfig.appName,
            FIRST_NAME: input.name,
            FULL_NAME: input.name,
            SUPPORT_EMAIL: email_1.emailConfig.supportEmail,
            ACTION_URL: input.actionUrl ?? "",
            CODE: input.code ?? "",
            HOME_URL: email_1.emailConfig.appHomeUrl,
        },
    };
};
const sendEmail = async ({ toEmail, toName, template, hostedTemplate, }) => {
    const resend = getResendClient();
    const from = getSender();
    const replyTo = email_1.emailConfig.resend.replyTo;
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
            throw new CustomError_1.CustomError("We could not send the email right now. Please try again shortly.", 500);
        }
    }
    catch (error) {
        if (error instanceof CustomError_1.CustomError) {
            throw error;
        }
        console.error("Failed to send email with Resend:", error);
        throw new CustomError_1.CustomError("We could not send the email right now. Please try again shortly.", 500);
    }
};
const sendVerificationEmail = async ({ email, name, code, }) => {
    const template = (0, verificationEmailTemplate_1.buildVerificationEmailTemplate)({
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
exports.sendVerificationEmail = sendVerificationEmail;
const sendEmailChangeVerificationEmail = async ({ email, name, code, }) => {
    const template = (0, emailChangeVerificationTemplate_1.buildEmailChangeVerificationTemplate)({
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
            actionUrl: email_1.emailConfig.verifyEmailChangeActionUrl(code),
        }),
    });
};
exports.sendEmailChangeVerificationEmail = sendEmailChangeVerificationEmail;
const sendPasswordResetEmail = async ({ email, name, code }) => {
    const template = (0, passwordResetTemplate_1.buildPasswordResetTemplate)({
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
            actionUrl: email_1.emailConfig.resetPasswordPageUrl(code),
        }),
    });
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendWelcomeEmail = async ({ email, name }) => {
    const template = (0, welcomeEmailTemplate_1.buildWelcomeEmailTemplate)({
        name,
        actionUrl: email_1.emailConfig.appHomeUrl,
    });
    await sendEmail({
        toEmail: email,
        toName: name,
        template,
        hostedTemplate: buildHostedTemplate("welcome", {
            email,
            name,
            actionUrl: email_1.emailConfig.appHomeUrl,
        }),
    });
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendEmailChangeSuccessEmail = async ({ email, name, actionUrl, }) => {
    const template = (0, emailChangeSuccessTemplate_1.buildEmailChangeSuccessTemplate)({
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
exports.sendEmailChangeSuccessEmail = sendEmailChangeSuccessEmail;
const sendPasswordResetSuccessEmail = async ({ email, name, actionUrl, }) => {
    const template = (0, passwordResetSuccessTemplate_1.buildPasswordResetSuccessTemplate)({
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
exports.sendPasswordResetSuccessEmail = sendPasswordResetSuccessEmail;
const sendSwapRequestReceivedEmail = async ({ email, name, otherUserName, requestedSkillTitle, offeredSkillTitle, actionUrl, }) => {
    const template = (0, swapRequestReceivedTemplate_1.buildSwapRequestReceivedTemplate)({
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
exports.sendSwapRequestReceivedEmail = sendSwapRequestReceivedEmail;
const sendSwapRequestAcceptedEmail = async ({ email, name, otherUserName, requestedSkillTitle, offeredSkillTitle, actionUrl, }) => {
    const template = (0, swapRequestAcceptedTemplate_1.buildSwapRequestAcceptedTemplate)({
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
exports.sendSwapRequestAcceptedEmail = sendSwapRequestAcceptedEmail;
