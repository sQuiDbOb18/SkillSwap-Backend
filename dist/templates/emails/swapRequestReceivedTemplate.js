"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSwapRequestReceivedTemplate = void 0;
const layout_1 = require("./layout");
const buildSwapRequestReceivedTemplate = ({ name, requesterName, requestedSkillTitle, offeredSkillTitle, actionUrl, }) => ({
    subject: `${requesterName} sent you a swap request`,
    html: (0, layout_1.renderEmailLayout)({
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
    text: (0, layout_1.buildText)([
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
exports.buildSwapRequestReceivedTemplate = buildSwapRequestReceivedTemplate;
