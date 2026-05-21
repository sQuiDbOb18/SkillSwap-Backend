import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type SwapRequestReceivedTemplateInput = {
  name: string;
  requesterName: string;
  requestedSkillTitle: string;
  offeredSkillTitle: string;
  actionUrl: string;
};

export const buildSwapRequestReceivedTemplate = ({
  name,
  requesterName,
  requestedSkillTitle,
  offeredSkillTitle,
  actionUrl,
}: SwapRequestReceivedTemplateInput): EmailTemplateResult => ({
  subject: `${requesterName} sent you a swap request`,
  html: renderEmailLayout({
    preheader: "You have a new skill swap request.",
    title: "New swap request",
    intro: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 16px;"><strong>${requesterName}</strong> wants to swap skills with you.</p>
      <p style="margin:0 0 16px;">They requested <strong>${requestedSkillTitle}</strong> and offered <strong>${offeredSkillTitle}</strong> in return.</p>
      <p style="margin:0;">Open your bookings to review and respond.</p>
    `,
    ctaLabel: "Review request",
    ctaUrl: actionUrl,
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `${requesterName} sent you a swap request.`,
    `Requested skill: ${requestedSkillTitle}`,
    `Offered skill: ${offeredSkillTitle}`,
    "",
    "Open your bookings to review and respond.",
    actionUrl,
  ]),
});
