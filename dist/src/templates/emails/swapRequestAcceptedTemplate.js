"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSwapRequestAcceptedTemplate = void 0;
const layout_1 = require("./layout");
const buildSwapRequestAcceptedTemplate = ({ name, accepterName, requestedSkillTitle, offeredSkillTitle, actionUrl, }) => ({
    subject: `${accepterName} accepted your swap request`,
    html: (0, layout_1.renderEmailLayout)({
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
    text: (0, layout_1.buildText)([
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
exports.buildSwapRequestAcceptedTemplate = buildSwapRequestAcceptedTemplate;
