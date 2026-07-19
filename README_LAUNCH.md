# EstateIn — Real Estate Marketplace for Kenya

**Status:** Pre-launch MVP (buyer/agent/landlord marketplace for buying, renting, listing properties)

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Docker (optional, for full stack)

### Local Development (5 min)

```bash
# Clone repo
git clone <repo>
cd estate

# Backend setup
cd estate-backend
cp .env.example .env
docker-compose up -d  # Postgres + Redis
npm install
npx prisma migrate dev
npm run seed  # Creates demo accounts
npm run dev   # Starts on :3000

# Frontend setup (new terminal)
cd app
npm install
npm run dev   # Starts on :5173
```

**Demo Accounts (all with password `Password1`):**
- Buyer: `buyer@estatein.com`
- Agent: `agent@estatein.com`
- Admin: `admin@estatein.com`

### Environment Variables

**Backend (`.env`):**
```
DATABASE_URL=postgres://user:password@localhost:5432/estatein
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random-256-char-string>
VITE_API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# M-Pesa (get from Safaricom)
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=...
MPESA_CALLBACK_URL=https://api.yourdomain.com/api/payments/mpesa/callback
MPESA_CALLBACK_TOKEN=<random-secret>

# SMS (Africa's Talking, Vonage, or Twilio)
SMS_PROVIDER=africastalking
SMS_API_KEY=...
SMS_API_SECRET=...

# Firebase (optional, for push notifications)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Sentry (production error tracking)
SENTRY_DSN=https://...@sentry.io/...
```

**Frontend (`.env.local`):**
```
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_MAPS_API_KEY=...
VITE_SENTRY_DSN=https://...@sentry.io/...
```

## Architecture

```
EstateIn Frontend (React 19 + TypeScript + Tailwind)
    ↓
api-client.ts (JWT fetch wrapper, localStorage auth)
    ↓
Backend API (Express + TypeScript + Prisma + PostgreSQL)
    ├── /api/properties (CRUD, search, filters)
    ├── /api/inquiries (buyer inquiries, viewing scheduling)
    ├── /api/payments (M-Pesa STK push, webhooks)
    ├── /api/auth (login, 2FA, OTP)
    └── /api/admin (moderation, analytics)
    ↓
PostgreSQL (user accounts, listings, payments, inquiries)
Redis (sessions, caching, rate limits)
Elasticsearch (property search, filters) [optional fallback to Postgres full-text]
```

## Key Features

### Core Marketplace
- ✅ Browse properties (buy/rent) with filters (location, price, beds/baths)
- ✅ Property detail pages with images, amenities, agent info
- ✅ Schedule viewings (buyer requests, agent confirms, SMS notifications)
- ✅ Favorites and saved searches
- ✅ In-app inquiries + WhatsApp/Email contact options
- ✅ M-Pesa deposits to secure viewings (optional, shows buyer seriousness)

### For Agents
- ✅ Create/edit listings with images, pricing, amenities
- ✅ Inquiry dashboard (see all buyer requests)
- ✅ Confirm/reschedule viewings, SMS buyer
- ✅ Analytics (property views, inquiry conversion, contact leads)
- ✅ Commission tracking (future: auto-paid on deal close)

### For Landlords
- ✅ Manage properties for rent
- ✅ Track tenants (lease start/end, rent payment status)
- ✅ Maintenance request tracking
- ✅ Tenant communication (in-app + SMS)

### Auth & Security
- ✅ Email/password signup + 2FA (TOTP authenticator)
- ✅ OTP passwordless login (SMS code)
- ✅ JWT sessions (httpOnly cookies)
- ✅ Role-based access (buyer/agent/landlord/admin)

### Kenya-Specific
- ✅ All 47 counties + Nairobi suburbs (estates)
- ✅ Multi-currency (KES, USD, EUR, GBP with live rates)
- ✅ M-Pesa payments (Safaricom STK push)
- ✅ SMS via Africa's Talking / Vonage / Twilio
- ✅ Mobile-first design (80% of traffic is mobile in Kenya)

## Testing

```bash
# Unit tests (frontend + backend)
npm test          # 10 tests pass

# E2E tests (Playwright, mock backend)
npm run test:e2e  # 2 scenarios pass (browse → detail → inquiry gate, map search)

# Integration tests (backend only, mocked Postgres)
cd estate-backend && npm test  # 32 tests pass

# Full typecheck
npx tsc -b --noEmit

# Linting
npm run lint
```

**Before launch:** Run all tests + load test (see `TESTING_WORKFLOWS.md`)

## Deployment

### Production Checklist
See `LAUNCH_OPS_CHECKLIST.md` for the full ops checklist. TL;DR:
- [ ] SSL certificate + domain
- [ ] Sentry error tracking
- [ ] PostgreSQL daily backups (S3)
- [ ] Environment variables set (.env.production)
- [ ] Health check endpoint verified
- [ ] Database migrations applied (`npx prisma migrate deploy`)

### Deploy via Docker (recommended)
```bash
# Backend
docker build -t estatein-api:latest -f estate-backend/Dockerfile .
docker run -e DATABASE_URL=... -e JWT_SECRET=... -p 3000:3000 estatein-api:latest

# Frontend
docker build -t estatein-web:latest -f app/Dockerfile .
docker run -p 5173:5173 estatein-web:latest
```

### OR Deploy to DigitalOcean/AWS/Heroku
- Use the `docker-compose.yml` as a template for your hosting platform
- Ensure `/health` endpoint returns `{ status: "ok" }` for load balancer
- Set `NODE_ENV=production` and all `.env` vars from secrets manager

## Troubleshooting

### M-Pesa Payment Fails
1. Check `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` are set
2. Verify `MPESA_CALLBACK_URL` matches your actual domain
3. Check Sentry for error details
4. Test with sandbox credentials first: Safaricom provides test phone numbers

### Property Search Slow
- Elasticsearch not running? Falls back to Postgres `LIKE` (slower)
- Adjust `SEARCH_RESULT_LIMIT` in `backend/.env` (default 100)

### SMS Not Sent
- Check SMS provider credentials (Africa's Talking/Vonage/Twilio)
- Verify phone numbers are in E.164 format (+254712345678)
- Check Sentry for provider-specific errors

### 2FA/OTP Not Working
- Confirm TOTP secret matches authenticator app time (sync to NTP)
- Check SMS provider is configured and credentials valid
- Clear browser localStorage if state is stale

## Roadmap (Post-MVP)

### v1.1 (2 weeks)
- [ ] Card payments (Stripe/Paystack) as M-Pesa fallback
- [ ] Email templates (inquiry received, viewing confirmed, etc.)
- [ ] Expanded agent profiles (ratings, verified badge, sales history)

### v2.0 (Q2 2026)
- [ ] Developer projects (new-construction sales, off-plan)
- [ ] Mortgage pre-qualification (integrate with fintech partners)
- [ ] Virtual tours + 3D walkthroughs
- [ ] Automated appraisals (ML valuation model)
- [ ] Commission marketplace (agents bid on buyer inquiries)

## Architecture Decisions

**Why Postgres + Prisma?**
- SQL-strong consistency needed for financial transactions (payments, deposits)
- Prisma provides type-safe migrations and ORM
- Can scale: read replicas for analytics queries

**Why Redis?**
- Session caching (JWT fast lookups)
- Rate limiting (sliding window counter)
- Temporary storage (OTP codes, 2FA secrets)

**Why M-Pesa first?**
- 85% of Kenyan adults use M-Pesa; instant recognition
- No extra banking relationships needed (Safaricom handles it)
- STK push UX is native (no redirect to external page)

**Why React 19 + Vite?**
- Fast build times (Vite is 10x faster than CRA)
- React 19 hooks + suspense for modern async UX
- Tailwind for rapid responsive design (dark theme built-in)

**Why Playwright E2E?**
- Mocked backend (no DB needed for E2E) = fast, hermetic tests
- Can test full user flows in CI without spinning up services
- Good for verifying UI against API contracts

## Support & Issues

**Bug reports:** Email support@estatein.com or DM on WhatsApp  
**Agent onboarding:** guides/agent-onboarding.md  
**Buyer help:** docs/buyer-guide.md  
**Landlord help:** docs/landlord-guide.md  

---

**Last updated:** 2026-07-15  
**Next launch review:** 2026-07-18 (72 hours before go-live)
