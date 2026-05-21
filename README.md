# SkillSwap Backend

A TypeScript Express backend for the SkillSwap application, using Prisma for database access, JWT authentication, real-time WebSocket messaging, and optional email sending via Resend.

## Features

- Express API with versioned routes
- PostgreSQL database via Prisma
- JWT access and refresh token handling
- Socket.io chat/socket support
- Email templates and Resend integration
- Environment-driven configuration

## Requirements

- Node.js `>=20 <25`
- PostgreSQL-compatible database
- npm

## Quick start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Update `.env` with your own values:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- email provider settings
- application URLs

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client:

```bash
npm run db:generate
```

5. Run database migrations:

```bash
npm run db:migrate
```

6. Start development server:

```bash
npm run dev
```

The API runs by default on `http://localhost:4000`.

## Production deployment

Build the app:

```bash
npm run build
```

Start the server:

```bash
npm start
```

For production, make sure the required environment variables are provided by your host or deployment platform.

## Available scripts

- `npm run dev` — start the TypeScript development server
- `npm run build` — compile TypeScript to `dist`
- `npm start` — run the compiled production server
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — run Prisma migrations
- `npm run db:push` — push Prisma schema to the database
- `npm run db:studio` — open Prisma Studio

## Environment variables

Required:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_URL`
- `API_URL`
- `APP_NAME`
- `SUPPORT_EMAIL`
- `RESEND_API_KEY` (required for Resend email senders)
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `RESEND_REPLY_TO`

Optional / defaults:

- `ACCESS_TOKEN_EXPIRES_IN` — default `15m`
- `REFRESH_TOKEN_EXPIRES_IN` — default `7d`
- `PORT` — default `4000`
- `HOST` — default `0.0.0.0`
- `BOOKINGS_PAGE_URL`
- `SIGN_IN_URL`
- `APP_HOME_URL`
- `MAIL_FROM_EMAIL`
- `MAIL_FROM_NAME`
- `VERIFY_ACCOUNT_URL`
- `VERIFY_EMAIL_CHANGE_URL`
- `RESET_PASSWORD_URL`
- `VERIFY_ACCOUNT_SUCCESS_URL`
- `VERIFY_ACCOUNT_FAILURE_URL`
- `VERIFY_EMAIL_CHANGE_SUCCESS_URL`
- `VERIFY_EMAIL_CHANGE_FAILURE_URL`
- `RESEND_TEMPLATE_*` values for optional hosted email templates

## Notes

- `.env` is intentionally ignored by Git.
- Keep secrets out of version control and configure them through your deployment platform.
- If you do not provide specific email template IDs, the app will use local templates.
- `CLIENT_URL` may include one or more allowed origins separated by commas for CORS.

## Confirmed setup

- `.gitignore` already excludes `.env`
- Existing app uses `dotenv/config` and expects the variables listed above
- `README.md` and `env.example` are now present for onboarding and deployment
