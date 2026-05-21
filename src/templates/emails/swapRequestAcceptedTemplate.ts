import { emailConfig } from "../../config/email";
import { buildText, renderEmailLayout } from "./layout";
import { EmailTemplateResult } from "./types";

type SwapRequestAcceptedTemplateInput = {
  name: string;
  accepterName: string;
  requestedSkillTitle: string;
  offeredSkillTitle: string;
  actionUrl: string;
};

export const buildSwapRequestAcceptedTemplate = ({
  name,
  accepterName,
  requestedSkillTitle,
  offeredSkillTitle,
  actionUrl,
}: SwapRequestAcceptedTemplateInput): EmailTemplateResult => ({
  subject: `${accepterName} accepted your swap request`,
  html: renderEmailLayout({
    preheader: "Your skill swap request was accepted.",
    title: "Swap request accepted",
    intro: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 16px;"><strong>${accepterName}</strong> accepted your swap request.</p>
      <p style="margin:0 0 16px;">Your request for <strong>${requestedSkillTitle}</strong> in exchange for <strong>${offeredSkillTitle}</strong> is now confirmed.</p>
      <p style="margin:0;">Open your bookings to see the next steps.</p>
    `,
    ctaLabel: "View booking",
    ctaUrl: actionUrl,
  }),
  text: buildText([
    `Hi ${name},`,
    "",
    `${accepterName} accepted your swap request.`,
    `Requested skill: ${requestedSkillTitle}`,
    `Offered skill: ${offeredSkillTitle}`,
    "",
    "Open your bookings to see the next steps.",
    actionUrl,
  ]),
});
