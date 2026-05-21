"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderResetPasswordSuccessPage = exports.renderResetPasswordPage = exports.renderForgotPasswordRequestPage = exports.renderVerifyEmailSuccessPage = exports.renderVerifyEmailPage = void 0;
const escapeHtml = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const pageShell = ({ title, heading, description, body, }) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5efe6;
        --card: #fffdf9;
        --text: #1f2937;
        --muted: #6b7280;
        --line: #e8dccb;
        --accent: #0f766e;
        --accent-dark: #115e59;
        --danger: #b42318;
        --danger-bg: #fef3f2;
        --success: #027a48;
        --success-bg: #ecfdf3;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(circle at top, rgba(15, 118, 110, 0.12), transparent 30%),
          linear-gradient(180deg, #fbf7f1 0%, var(--bg) 100%);
        font-family: Arial, sans-serif;
        color: var(--text);
      }
      .card {
        width: min(100%, 460px);
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 32px 24px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 30px;
        line-height: 1.1;
      }
      p {
        margin: 0 0 18px;
        color: var(--muted);
        line-height: 1.6;
      }
      form {
        display: grid;
        gap: 14px;
      }
      label {
        display: grid;
        gap: 6px;
        font-size: 14px;
        color: var(--text);
      }
      input {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 14px 16px;
        font-size: 16px;
      }
      input:focus {
        outline: 2px solid rgba(15, 118, 110, 0.2);
        border-color: var(--accent);
      }
      .code-input {
        text-align: center;
        letter-spacing: 8px;
        font-size: 28px;
        font-weight: 700;
      }
      .button,
      button {
        display: inline-flex;
        width: 100%;
        justify-content: center;
        align-items: center;
        border: none;
        border-radius: 999px;
        padding: 14px 18px;
        background: var(--accent);
        color: white;
        font-size: 16px;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
      }
      .button.secondary {
        background: #ffffff;
        color: var(--text);
        border: 1px solid var(--line);
      }
      .notice {
        border-radius: 14px;
        padding: 12px 14px;
        margin-bottom: 18px;
        font-size: 14px;
        line-height: 1.5;
      }
      .notice.error {
        color: var(--danger);
        background: var(--danger-bg);
      }
      .notice.success {
        color: var(--success);
        background: var(--success-bg);
      }
      .stack {
        display: grid;
        gap: 12px;
      }
      .small {
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${escapeHtml(heading)}</h1>
      <p>${escapeHtml(description)}</p>
      ${body}
    </main>
  </body>
</html>`;
const renderNotice = (message, tone = "error") => message
    ? `<div class="notice ${tone}">${escapeHtml(message)}</div>`
    : "";
const renderVerifyEmailPage = ({ actionUrl, successUrl, code = "", email = "", error, }) => pageShell({
    title: "Verify Email",
    heading: "Verify your email",
    description: "Enter the 4-digit code we sent to your email address to activate your account.",
    body: `
      ${renderNotice(error)}
      <form method="post" action="${escapeHtml(actionUrl)}">
        <input type="hidden" name="successUrl" value="${escapeHtml(successUrl)}" />
        <label>
          Email
          <input type="email" name="email" value="${escapeHtml(email)}" autocomplete="email" />
        </label>
        <label>
          Verification code
          <input class="code-input" type="text" inputmode="numeric" name="code" minlength="4" maxlength="4" value="${escapeHtml(code)}" required />
        </label>
        <button type="submit">Verify email</button>
      </form>
    `,
});
exports.renderVerifyEmailPage = renderVerifyEmailPage;
const renderVerifyEmailSuccessPage = ({ loginUrl, }) => pageShell({
    title: "Email Verified",
    heading: "Email verified",
    description: "Your account is ready. You can sign in now.",
    body: `
      ${renderNotice("Verification successful.", "success")}
      <div class="stack">
        <a class="button" href="${escapeHtml(loginUrl)}">Go to login</a>
      </div>
    `,
});
exports.renderVerifyEmailSuccessPage = renderVerifyEmailSuccessPage;
const renderForgotPasswordRequestPage = ({ actionUrl, resetUrl, email = "", message, error, }) => pageShell({
    title: "Forgot Password",
    heading: "Reset your password",
    description: "Enter your email address and we will send you a code to reset your password.",
    body: `
      ${renderNotice(error)}
      ${renderNotice(message, "success")}
      <form method="post" action="${escapeHtml(actionUrl)}">
        <input type="hidden" name="resetUrl" value="${escapeHtml(resetUrl)}" />
        <label>
          Email
          <input type="email" name="email" value="${escapeHtml(email)}" autocomplete="email" required />
        </label>
        <button type="submit">Request code</button>
      </form>
    `,
});
exports.renderForgotPasswordRequestPage = renderForgotPasswordRequestPage;
const renderResetPasswordPage = ({ actionUrl, successUrl, email = "", code = "", message, error, }) => pageShell({
    title: "Enter Reset Code",
    heading: "Finish resetting",
    description: "Enter the code from your email and choose a new password.",
    body: `
      ${renderNotice(error)}
      ${renderNotice(message, "success")}
      <form method="post" action="${escapeHtml(actionUrl)}">
        <input type="hidden" name="successUrl" value="${escapeHtml(successUrl)}" />
        <label>
          Email
          <input type="email" name="email" value="${escapeHtml(email)}" autocomplete="email" />
        </label>
        <label>
          Reset code
          <input class="code-input" type="text" inputmode="numeric" name="code" minlength="6" maxlength="6" value="${escapeHtml(code)}" required />
        </label>
        <label>
          New password
          <input type="password" name="newPassword" autocomplete="new-password" required />
        </label>
        <label>
          Confirm new password
          <input type="password" name="confirmPassword" autocomplete="new-password" required />
        </label>
        <button type="submit">Reset password</button>
      </form>
    `,
});
exports.renderResetPasswordPage = renderResetPasswordPage;
const renderResetPasswordSuccessPage = ({ loginUrl, }) => pageShell({
    title: "Password Reset Successful",
    heading: "Password reset successful",
    description: "You can sign in with your new password. Redirecting back to login shortly.",
    body: `
      ${renderNotice("Your password was updated successfully.", "success")}
      <div class="stack">
        <a class="button" href="${escapeHtml(loginUrl)}">Back to login</a>
      </div>
      <p class="small">If nothing happens, use the button above.</p>
      <script>
        window.setTimeout(function () {
          window.location.href = ${JSON.stringify(loginUrl)};
        }, 3000);
      </script>
    `,
});
exports.renderResetPasswordSuccessPage = renderResetPasswordSuccessPage;
