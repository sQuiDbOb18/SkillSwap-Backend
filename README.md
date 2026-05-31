# SkillSwap Backend

A TypeScript Express backend for the SkillSwap application, using Prisma for database access, JWT authentication, real-time WebSocket messaging, and optional email sending via Resend.

## Features

- Express API with versioned routes
- PostgreSQL database via Prisma
- JWT access and refresh token handling
- Email/password signup with auto-login after verification
- Google signup/login with verified Google emails
- Socket.io chat/socket support
- Email templates and Resend integration
- Cloudinary profile image uploads
- Health/readiness endpoints
- Redis-compatible rate limiting when `REDIS_URL` is configured
- API reference notes for mobile/client integration
- Skill favorites, saved searches, and search history
- Booking conflict checks
- Admin moderation audit CSV export
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
- Google OAuth settings if you enable Google signup/login
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

## Docker start

Use this when you want to run the backend without manually running npm commands.

1. Install and open Docker Desktop.
2. Make sure `.env` exists and contains your real `DATABASE_URL` and secrets.
3. Build and start the backend:

```bash
docker compose up --build
```

The API runs on:

```txt
http://localhost:4000
```

Stop it with:

```bash
docker compose down
```

The compose file also starts a local Redis container on port `6379`. By default, Docker Compose sets `REDIS_URL=redis://redis:6379`, so rate limits use Redis locally.

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

### Render setup

You can keep everything on Render if you want one provider/bill:

1. Create a Render PostgreSQL database.
2. Create a Render Key Value instance for Redis-compatible rate limiting.
3. Create a Render Web Service for this backend.
4. Add the PostgreSQL connection string as `DATABASE_URL`.
5. Add the Key Value internal Redis URL as `REDIS_URL`.
6. Add the rest of the required environment variables.
7. Set the health check path to `/health`.

Render free web services can spin down after inactivity, so the first request after a quiet period may be slow.

If deploying this Docker image to a host, the container start command runs:

```bash
npm run db:deploy && npm start
```

That means Prisma migrations run before the server starts. Make sure the production database migration baseline is fixed before using this in production.

## Available scripts

- `npm run dev` — start the TypeScript development server
- `npm run build` — compile TypeScript to `dist`
- `npm start` — run the compiled production server
- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — run Prisma migrations
- `npm run db:deploy` — apply migrations in production
- `npm run db:push` — push Prisma schema to the database
- `npm run db:studio` — open Prisma Studio
- `npm run db:seed` — seed local demo data
- `npm run check` — generate Prisma client, build, and run tests

## API documentation

- Health check: `http://localhost:4000/health`
- OpenAPI spec: `docs/openapi.yaml`
- Route reference: `docs/api.md`

### Auth behavior

- `POST /api/v1/auth/register` creates a pending registration and sends a verification code.
- `POST /api/v1/auth/verify-email` creates the user, marks the account verified, returns `accessToken` and `refreshToken`, and sets the refresh-token cookie.
- `POST /api/v1/auth/google` accepts a Google ID token or authorization code. If the email is new, it creates a verified account and signs the user in. If the user already exists, it signs them in. Google-authenticated users do not need a separate email verification step.

## Environment variables

Required:

- `DATABASE_URL`
- `REDIS_URL` (recommended for production rate limiting)
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_CLIENT_ID` (required for Google signup/login)
- `GOOGLE_CLIENT_SECRET` (required when exchanging Google authorization codes)
- `CLIENT_URL`
- `API_URL`
- `APP_NAME`
- `SUPPORT_EMAIL`
- `RESEND_API_KEY` (required for Resend email senders)
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `RESEND_REPLY_TO`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional / defaults:

- `ACCESS_TOKEN_EXPIRES_IN` — default `15m`
- `REFRESH_TOKEN_EXPIRES_IN` — default `7d`
- `GOOGLE_REDIRECT_URI` — default should match your frontend Google callback, for example `http://localhost:3000/auth/google/callback`
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
- JWT secrets must be at least 32 characters.
- `docs/api.md` is the hand-written route reference you can use to fill an external Swagger/OpenAPI tool.

## Confirmed setup

- `.gitignore` already excludes `.env`
- Existing app uses `dotenv/config` and expects the variables listed above
- `README.md` and `.env.example` are now present for onboarding and deployment
