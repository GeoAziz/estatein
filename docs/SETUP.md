# Developer Setup

This repo has two apps that run independently: `app/` (frontend) and `estate-backend/` (API). This guide gets both running locally. For an architectural overview instead, see [/CLAUDE.md](../CLAUDE.md).

## Prerequisites

- Node.js 18+ LTS
- Docker (for Postgres + LocalStack in dev)

## 1. Start backing services

From `estate-backend/`:

```bash
cd estate-backend
docker-compose up -d   # PostgreSQL + LocalStack (S3/SQS/SNS mocks)
```

(The root-level `docker-compose.yml` also exists and additionally brings up Redis, Elasticsearch, Prometheus, Grafana, and Mailhog — use it if you need those; the lighter `estate-backend/docker-compose.yml` is enough for day-to-day API work.)

## 2. Backend

```bash
cd estate-backend
npm install
cp .env.example .env        # fill in / adjust as needed — see below
npx prisma migrate dev       # apply schema, generates the Prisma client
npm run seed                 # seeds demo accounts + Kenyan counties/estates
npm run dev                  # tsx watch src/server.ts → http://localhost:3000
```

Health check: `curl http://localhost:3000/health` → `{"status":"ok",...}`

Other useful scripts:

```bash
npm run build            # tsc
npm run prisma:studio    # visual DB browser
npm run lint              # eslint src/ (currently missing a config file — see note below)
```

### Key environment variables (`estate-backend/.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Sign access/refresh tokens — **required**, no default in production mode |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (defaults: `24h` / `7d`) |
| `FRONTEND_URL` | Used for CORS origin — must match the app's actual origin exactly since auth cookies are credentialed |
| `AWS_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` | S3 (LocalStack in dev) for photo/document uploads |
| `SMTP_HOST`/`SMTP_PORT`/`SMTP_FROM` | Email (Mailhog in dev, catches mail at `http://localhost:8025`) |
| `ADMIN_NOTIFICATION_EMAIL` | Where public contact-form leads get emailed |
| `MPESA_*` | M-Pesa STK push credentials (sandbox by default) |

Auth now uses **httpOnly cookies**, not tokens returned in the response body — see [API_REFERENCE.md](./API_REFERENCE.md#authentication). If you're testing the API with curl/Postman rather than the frontend, you'll need to persist cookies across requests (`curl -c cookies.txt -b cookies.txt ...`) rather than grabbing a token out of the JSON response.

## 3. Frontend

```bash
cd app
npm install
npm run dev       # Vite dev server → http://localhost:5173
```

Frontend env (`app/.env.local`):

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Estatein
```

Other scripts: `npm run build` (`tsc -b && vite build`), `npm run lint` (oxlint), `npm run preview`.

## Demo accounts

Seeded by `npm run seed` in the backend, all with password `Password1`:

| Role | Email |
|---|---|
| Admin | `admin@estatein.com` |
| Agent | `agent@estatein.com` |
| Buyer | `buyer@estatein.com` |

## 4. Verify the integration end to end

1. Go to `http://localhost:5173/login`, sign in as `buyer@estatein.com`.
2. Open DevTools → Network — you should see requests to `http://localhost:3000/api/...` with cookies attached (not an `Authorization` header).
3. Open DevTools → Application → Cookies — you should see `accessToken` and `refreshToken` marked `HttpOnly`, scoped to `localhost`.
4. Browse `/properties`, apply a filter, and confirm the request includes your filter as query params.
5. As the agent account, create a listing via the wizard and confirm an uploaded photo produces a real (non-`blob:`) URL after the upload finishes.

## Troubleshooting

**CORS or cookie errors ("credentials" mode issues)**
- `FRONTEND_URL` in the backend `.env` must exactly match the origin the frontend is served from (protocol + host + port).
- The frontend must call `fetch` with `credentials: "include"` (already the case in `src/lib/api-client.ts`) — otherwise cookies won't be sent/stored.

**"API request failed" / can't reach backend**
```bash
curl http://localhost:3000/health
docker-compose ps          # from estate-backend/ — confirm postgres/localstack are healthy
npx prisma migrate status  # confirm migrations applied
```

**Backend `npm run lint` fails with "ESLint couldn't find a configuration file"**
This is a pre-existing gap in the repo, not something you did — there's no `eslint.config.js`/`.eslintrc` checked in yet for `estate-backend/`. Rely on `npm run build` (`tsc`) for now until that's added.

## Deployment

`.github/workflows/test-and-build.yml` runs backend/frontend builds, a security scan, and Docker image builds on push/PR to `main`/`develop`. `.github/workflows/deploy.yml` deploys to staging on push to `main` and to production after that, via SSH + `docker-compose` on the target host — see those workflow files directly for the exact steps and required repo secrets before touching deploy config.
