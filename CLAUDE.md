# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is a monorepo (not currently a git repo) with two independently run apps plus reference/design material:

- `app/` — React 19 + TypeScript + Vite frontend ("EstateIn")
- `estate-backend/` — Express + TypeScript + Prisma/PostgreSQL API
- `figma-exact/` — Static JSON exports from the Figma REST API (text strings, layout specs) used as design reference when implementing pages pixel-for-pixel. Not application code.
- `real-estate-business-website-ui-template---dark-theme-_-produce-ui-(community)-spec.md` — original design spec for the site.
- `COMPLETED_IMPLEMENTATIONS.md`, `IMPLEMENTATION_GUIDE.md`, `VALIDATION_CHECKLIST.md` — living docs tracking the Kenya-market feature build-out (M-Pesa, counties/estates, multi-currency, etc.) against a validation checklist. Check these before assuming a feature is missing.
- `docs/` — product-facing documentation: [docs/README.md](docs/README.md) indexes a product overview, full API reference, developer setup guide, and end-user guide. Keep these in sync when routes, auth, or user-facing flows change.
- Root `docker-compose.yml` — full-stack orchestration (Postgres, Redis, LocalStack, Elasticsearch, Prometheus, Grafana, Mailhog, backend, frontend). `estate-backend/docker-compose.yml` is a lighter dev-only compose (Postgres + LocalStack).

There are no automated test suites configured in either `package.json` yet (`npm test` is a no-op); CI (`.github/workflows/test-and-build.yml`) runs `--if-present` so it currently no-ops on the test step too.

## Commands

### Frontend (`app/`)
```bash
cd app
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # oxlint
npm run preview
```

### Backend (`estate-backend/`)
```bash
cd estate-backend
npm install
cp .env.example .env
docker-compose up -d       # Postgres + LocalStack
npx prisma migrate dev
npm run seed                # tsx prisma/seed.ts — creates demo accounts
npm run dev                  # tsx watch src/server.ts, http://localhost:3000
npm run build                # tsc
npm run lint                  # eslint src/
npx prisma studio             # inspect DB
```

Demo accounts (password `Password1` for all): `admin@estatein.com`, `agent@estatein.com`, `buyer@estatein.com`.

### Full stack via Docker
```bash
docker-compose up -d   # from repo root — backend on :3000, frontend on :5173
```

## Architecture

### Frontend → Backend flow
```
React components/pages → src/lib/api-client.ts (fetch wrapper, JWT in localStorage)
                        → Express routes (estate-backend/src/routes/*)
                        → controllers → Prisma → PostgreSQL
```
- `src/lib/api-client.ts` is the single fetch wrapper: attaches `Authorization: Bearer`, handles refresh tokens, normalizes `{ data, error }` responses. All server calls should go through it.
- `src/lib/auth-api.tsx` is the **real** auth context (`AuthProvider`, `ProtectedRoute`, `useAuth`) wired to the backend via `api-client.ts`. This is what `App.tsx` uses.
- `src/lib/store.ts` is a **legacy, unused, frontend-only mock persistence layer** (localStorage, no real backend) — it predates the backend integration. Nothing currently imports it; don't build on it, and treat any code near it as dead unless proven otherwise.
- Frontend env: `VITE_API_URL` (defaults to `http://localhost:3000/api`) in `app/.env.local`.
- Route protection is role-based: `<ProtectedRoute allow={["agent"]}>` etc., wrapping dashboard routes for `buyer`/`agent`/`admin` in `App.tsx`.

### Backend structure (`estate-backend/src/`)
Layered by responsibility, one file per resource across three parallel folders:
- `routes/*.ts` → `controllers/*.ts` → (`services/*.ts` for business logic) → Prisma (`prisma/schema.prisma`)
- `routes/index.ts` mounts every resource router under `/api/<resource>` — this is the map of the entire API surface; check it first when locating an endpoint.
- `middleware/`: `auth.ts` (JWT verification, attaches user to `req` if a valid token is present — runs globally in `app.ts`, so any route can check `req.user`), `errorHandler.ts`, `validation.ts` (Zod), `rateLimit.ts`, `security.ts`, `logging.ts` (Pino).
- `validators/*.ts`: Zod schemas per resource, used by `middleware/validation.ts`.
- `services/`: integrations and cross-cutting logic — `auth.ts`, `email.ts` (Nodemailer), `s3.ts` (AWS S3 / LocalStack in dev), `search.ts`, `notification.ts`, `currency.ts` (KES/USD/EUR/GBP conversion), `mpesa.ts` (M-Pesa STK push payments), `sms.ts`, `fcm.ts` (Firebase push), `oauth.ts` (Google/Apple), `websocket.ts` (Socket.io), `otp.ts`, `twoFactor.ts`.
- `app.ts` wires global middleware order: helmet → security headers → CORS (origin from `FRONTEND_URL`) → compression → body parsing → request logging → rate limiting (`/api/*`) → JWT extraction → routes → 404 → error handler.

### Data model (`estate-backend/prisma/schema.prisma`)
Domain is broader than a typical real-estate MVP — it's tailored for the Kenyan market. Key model groups:
- Core marketplace: `User`, `Agent`, `Property`, `Listing`, `Inquiry`/`InquiryReply`, `Favorite`, `SavedSearch`, `Review`
- Geography: `County` (all 47 Kenyan counties), `Estate` (Nairobi suburbs), `Neighborhood`, `School`/`PropertyNearbySchool`
- Money/payments: `Payment` (M-Pesa/card/bank transfer), `MortgageRate`, `MortgageApplication`
- Property lifecycle beyond simple listings: `DeveloperProject`/`ProjectPhase`/`ProjectUnit` (new-construction/off-plan sales), `Tenant`, `MaintenanceRequest` (property management)
- Support/ops: `SupportTicket`, `SystemSetting`, `Document` (S3-backed file refs), `Notification`, `ActivityLog`, `OtpCode`

When adding a feature, check `COMPLETED_IMPLEMENTATIONS.md` / `IMPLEMENTATION_GUIDE.md` first — much of the Kenya-specific surface (currency, M-Pesa, counties/estates, OTP/2FA, OAuth) was already built out against `VALIDATION_CHECKLIST.md` gaps.

## Security note

`serviceAccountKey.json` (Firebase) sits at the repo root. A root `.gitignore` now excludes it (and `.env`/`.env.local`/`*.key`/`*.pem` generally) so it won't enter git history going forward. It is **not currently read by any backend code path** — `services/fcm.ts` loads Firebase credentials from the `FIREBASE_SERVICE_ACCOUNT` env var (inline JSON), not from this file — so it's an orphaned credential with no functional purpose today. Because it sat unprotected in this environment before the `.gitignore` existed, **rotate/revoke it in the Firebase console** (Project Settings → Service Accounts) rather than assuming it's safe just because it's now gitignored; a `.gitignore` only prevents *future* commits, it doesn't undo any prior exposure. Once rotated, the local file can be deleted.
