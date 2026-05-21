import { emailConfig } from "../../config/email";

type EmailLayoutInput = {
  preheader: string;
  title: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryNote?: string;
};

export const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildText = (lines: string[]) => lines.join("\n");

export const renderEmailLayout = ({
  preheader,
  title,
  intro,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  secondaryNote,
}: EmailLayoutInput) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4efe7;font-family:Arial,sans-serif;color:#1f2937;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      ${escapeHtml(preheader)}
    </div>
    <div style="padding:32px 16px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #eadfce;">
        <div style="background:linear-gradient(135deg,#0f766e,#155e75);padding:32px 24px;color:#ffffff;">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:0.9;">${escapeHtml(
            emailConfig.appName
          )}</p>
          <h1 style="margin:0;font-size:30px;line-height:1.2;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:32px 24px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">${escapeHtml(intro)}</p>
          <div style="font-size:16px;line-height:1.7;color:#374151;">${bodyHtml}</div>
          ${
            ctaUrl && ctaLabel
              ? `
          <div style="margin:32px 0 24px;">
            <a href="${escapeHtml(
              ctaUrl
            )}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">
              ${escapeHtml(ctaLabel)}
            </a>
          </div>
          `
              : ""
          }
          ${
            secondaryNote
              ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.7;color:#6b7280;">${escapeHtml(
                  secondaryNote
                )}</p>`
              : ""
          }
          <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">
            Need help? Reply to this email or contact ${escapeHtml(emailConfig.supportEmail)}.
          </p>
        </div>
      </div>
    </div>
  </body>
</html>
`.trim();
