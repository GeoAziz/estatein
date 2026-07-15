# EstateIn — Product Overview

EstateIn is a real estate marketplace built for the Kenyan market, connecting property buyers/renters, agents, developers, and platform admins in one platform. It pairs a public-facing marketing/search site with role-based dashboards and a Kenya-specific transaction layer (M-Pesa payments, county/estate-level geography, KSh-first currency).

## Who it's for

| Audience | What they do on the platform |
|---|---|
| **Visitors / Buyers & Renters** | Browse and filter listings, view property details, compare properties side-by-side, save favorites and searches, contact agents, request viewings, use the mortgage calculator, read market trend / buying / selling / rental guides |
| **Agents** | List properties (multi-step wizard with photo upload), manage their listing portfolio, respond to buyer inquiries from a unified inbox, track per-listing analytics (views, favorites, inquiries) |
| **Admins** | Approve or reject pending listings (individually or in bulk), manage user accounts (activate/suspend), view platform-wide stats, moderate reported content |
| **Developers** *(schema-ready)* | Model new-construction/off-plan projects as phases and sellable units, track unit reservations |
| **Property managers / landlords** *(schema-ready)* | Track tenancies, rent, and maintenance requests |

## Core feature areas

### Property discovery
- Search and filter by location, property type, and price range (`/properties`, `/properties/for-sale`, `/properties/for-rent`, `/properties/new-construction`, `/properties/coming-soon`)
- Property detail pages with pricing breakdown, comparable homes, price history, and a Zestimate-style valuation
- Map-based search (`/map-search`)
- Side-by-side property comparison, persisted across pages (`/compare`)

### Buyer/renter tools
- Favorites and saved searches with optional alerts
- Inquiry + viewing-request flow to agents, with in-app messaging thread
- Mortgage calculator and pre-qualification estimate
- Buying / selling / rental guides, market trends content

### Agent tools
- Listing creation wizard (basic info → photos → details → review/publish), with real image upload to S3-backed storage
- Listing management (edit, duplicate, mark sold, bulk actions)
- Inbox for buyer inquiries with reply threads and viewing-status tracking
- Per-listing analytics

### Admin tools
- Pending-listing approval queue (single + bulk approve)
- User account management (activate/suspend)
- Platform stats dashboard

### Kenya-market specifics
- **Currency**: KSh (KES) as the default currency, with USD/EUR/GBP conversion support
- **Geography**: all 47 Kenyan counties and 25+ Nairobi estates/suburbs pre-populated, used for location-based search
- **Payments**: M-Pesa STK push integration (initiate payment, callback handling, status polling) alongside card/bank-transfer scaffolding
- **Notifications**: SMS (Africa's Talking / Vonage / Twilio), Firebase Cloud Messaging push, email
- **Auth extras**: OAuth (Google/Apple sign-in service layer), OTP and 2FA services exist in the codebase (see note below)

> Some backend capabilities (account deactivation/reactivation, GDPR-style data export, OTP login, 2FA) have controllers and routes implemented but are **not currently wired into the live API** — see [API_REFERENCE.md](./API_REFERENCE.md) for what's actually reachable today.

## Tech stack

- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS, react-router-dom
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL
- **Auth**: JWT access/refresh tokens carried in httpOnly cookies
- **Storage**: AWS S3 (LocalStack in development)
- **Infra (dev)**: Docker Compose (Postgres, Redis, LocalStack, Elasticsearch, Mailhog, Prometheus/Grafana)

## Where to go next

- New to the codebase? Start with [SETUP.md](./SETUP.md) to get both apps running locally.
- Building against the API? See [API_REFERENCE.md](./API_REFERENCE.md).
- Want to know how a specific role uses the product day-to-day? See [USER_GUIDE.md](./USER_GUIDE.md).
- Engineering conventions and architecture notes live in [/CLAUDE.md](../CLAUDE.md).
