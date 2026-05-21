"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailLayout = exports.buildText = exports.escapeHtml = void 0;
const email_1 = require("../../config/email");
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
exports.escapeHtml = escapeHtml;
const buildText = (lines) => lines.join("\n");
exports.buildText = buildText;
const renderEmailLayout = ({ preheader, title, intro, bodyHtml, ctaLabel, ctaUrl, secondaryNote, }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${(0, exports.escapeHtml)(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4efe7;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${(0, exports.escapeHtml)(preheader)}
    </div>
    <div style="padding:32px 16px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eadfce;">
        <div style="background:linear-gradient(135deg,#0f766e,#155e75);padding:32px 24px;color:#ffffff;">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:0.9;">${(0, exports.escapeHtml)(email_1.emailConfig.appName)}</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">${(0, exports.escapeHtml)(title)}</h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${(0, exports.escapeHtml)(intro)}</p>
          <div style="font-size:16px;line-height:1.7;color:#374151;">${bodyHtml}</div>
          ${ctaUrl && ctaLabel
    ? `
          <div style="margin:32px 0 24px;">
            <a href="${(0, exports.escapeHtml)(ctaUrl)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">
              ${(0, exports.escapeHtml)(ctaLabel)}
            </a>
          </div>
          `
    : ""}
          ${secondaryNote
    ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#6b7280;">${(0, exports.escapeHtml)(secondaryNote)}</p>`
    : ""}
          <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
            Need help? Reply to this email or contact ${(0, exports.escapeHtml)(email_1.emailConfig.supportEmail)}.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
`.trim();
exports.renderEmailLayout = renderEmailLayout;
