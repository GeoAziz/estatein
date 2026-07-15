# Product Requirements Document (PRD) — EstateIn

| | |
|---|---|
| **Product** | EstateIn — real estate marketplace for the Kenyan market |
| **Status** | Live MVP; several backend capabilities implemented but not yet exposed (see §8) |
| **Owning docs** | See [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md) for a narrative summary; this document is the formal requirements record |

## 1. Purpose & Background

EstateIn is a property marketplace connecting buyers/renters, agents, and platform admins, purpose-built for Kenya: KSh-first pricing, county/estate-level geography, and M-Pesa payments, alongside the standard search/listing/inquiry workflow of a real estate platform. The codebase also contains schema and service-layer support for adjacent markets (developer/off-plan sales, property management/tenancy) that are partially exposed today.

## 2. Goals & Objectives

1. Let buyers/renters discover and evaluate properties without friction (search, filter, compare, save, get a mortgage estimate).
2. Let agents list and manage inventory and respond to buyer demand without needing a separate CRM.
3. Give admins a moderation/approval gate so unreviewed listings never reach the public site.
4. Support Kenyan-market transaction realities (KSh currency, M-Pesa, county/estate geography, Kenyan phone number formats) as first-class, not bolted on.

## 3. Target users / personas

| Persona | Primary need |
|---|---|
| **Buyer/Renter** (unauthenticated or `buyer` role) | Find a property matching budget/location/type; contact an agent; get a rough mortgage/affordability sense |
| **Agent** (`agent` role) | List inventory quickly with real photos; not lose buyer leads; know which listings are performing |
| **Admin** (`admin` role) | Keep listing quality/legitimacy high; manage user accounts; see platform health at a glance |
| **Developer** (schema-ready, not yet a full role-driven UI) | Model a multi-phase, multi-unit new-construction project and track unit reservations |
| **Landlord/Property manager** (schema-ready) | Track tenancies, rent schedules, and maintenance requests |

## 4. Scope

### 4.1 In scope (implemented and live)

**Discovery & search**
- Property listing search/filter by location, type, price range; free-text search
- Property detail pages: pricing breakdown, features, comparable homes, price history, estimated value ("Zestimate")
- Map-based search
- Side-by-side comparison of up to 4 properties, persisted across navigation

**Buyer account features**
- Registration/login (email + password), password reset
- Favorites, saved searches (with optional alert frequency)
- Inquiries to agents, with optional viewing request (date/time) and choice of contact method (email/phone/WhatsApp/in-app)
- General contact-us / "help me find a property" leads that don't require an account (routed to the platform, not a specific agent)
- Mortgage calculator and pre-qualification estimate
- Buyer dashboard: favorites, saved searches, inquiries, scheduled viewings, account settings

**Agent features**
- Multi-step listing wizard (basic info → photos → details → review), with real image upload to S3-backed storage
- Listing management: edit, duplicate, mark sold, delete, bulk actions
- Inbox for buyer inquiries with reply threads and viewing-status updates
- Per-listing analytics (views, favorites, inquiry count)

**Admin features**
- Pending-listing approval queue (single and bulk approve/reject)
- User account listing and status management
- Platform stat summary (users, listings, pending approvals, active listings)

**Kenya-market requirements**
- KSh as default currency; USD/EUR/GBP conversion
- All 47 counties + 25+ Nairobi estates seeded as reference geography
- M-Pesa STK push payment initiation, callback handling, and status polling
- Kenyan phone number formatting/validation
- SMS notifications (Africa's Talking primary, Vonage/Twilio as alternates) and Firebase push notifications

**Platform/security**
- JWT-based auth carried in httpOnly cookies (not client-readable storage)
- Role-based access control (buyer/agent/admin, plus additional roles reserved for property-management/developer flows)

### 4.2 Modeled but not yet exposed in the product (backend-ready)

These have database models and/or service code but no route is mounted, or no frontend surface consumes them yet. Treat as backlog, not shipped functionality:
- Account deactivation/reactivation, GDPR-style data export, request-deletion flow
- OTP-based login and two-factor authentication
- OAuth (Google/Apple) sign-in
- Developer project / phase / unit management UI (API exists; no dedicated frontend pages)
- Tenancy and maintenance-request tracking UI (API exists; no dedicated frontend pages)
- Support ticket UI (API exists; no dedicated frontend pages)
- Document upload/verification UI beyond what agents use for listing photos
- Content moderation / reporting mechanism (the admin dashboard has a "Reported Listings" section with no way for users to actually file a report yet)

### 4.3 Explicitly out of scope for this PRD

- Payment methods beyond M-Pesa/card/bank-transfer scaffolding (no live card processor integration)
- Multi-language / localization beyond English copy
- Native mobile apps (push-notification service exists for a future mobile client, but there is no mobile app in this repo)

## 5. Functional requirements

Numbered by area; each maps to endpoints documented in [API_REFERENCE.md](./API_REFERENCE.md).

### FR-1 Authentication & accounts
- FR-1.1 Users can register as `buyer` or `agent` with email/password; agents additionally provide company/license info.
- FR-1.2 Users can log in and receive a session via httpOnly cookies; sessions are refreshable without re-entering credentials until the refresh token expires.
- FR-1.3 Users can request and complete a password reset via emailed token.
- FR-1.4 Users can update their own profile, notification preferences, and privacy settings.

### FR-2 Property search & discovery
- FR-2.1 Any visitor (no login required) can search/filter properties by location, type, and price range, and view full property detail pages.
- FR-2.2 The system returns comparable properties, price history, and an estimated value for any property.
- FR-2.3 Users can compare up to 4 properties at once from any page.

### FR-3 Favorites & saved searches
- FR-3.1 Signed-in buyers can favorite/unfavorite a property and view their favorites list.
- FR-3.2 Signed-in buyers can save a search configuration and optionally enable daily/weekly alerts.

### FR-4 Inquiries & communication
- FR-4.1 Signed-in users can submit an inquiry against a property/listing/agent with a message, contact method, and optional viewing request.
- FR-4.2 Agents/sellers can view, reply to, and update the status of inquiries directed at their listings.
- FR-4.3 Unauthenticated visitors can submit a general contact message (not tied to a specific property or agent) via the public contact form.

### FR-5 Listing management (agents)
- FR-5.1 Agents can create a listing with an associated property (address, type, price, beds/baths, size, photos, description, features/amenities).
- FR-5.2 New listings enter `pending` status and are not publicly visible until an admin approves them.
- FR-5.3 Agents can edit, duplicate, mark-sold, or delete their own listings; they cannot modify another agent's listings.
- FR-5.4 Agents can view aggregate and per-listing analytics (views, favorites, inquiries).

### FR-6 Moderation (admin)
- FR-6.1 Admins can view all listings pending approval and approve or reject them individually or in bulk; rejection requires a reason.
- FR-6.2 Admins can view all users and change account status (active/suspended/deleted).
- FR-6.3 Admins can view platform-wide stats.

### FR-7 Payments (Kenya)
- FR-7.1 The system can initiate an M-Pesa STK push payment for an authenticated user and track its status through a callback.
- FR-7.2 Users can view their payment history.

### FR-8 Mortgage tools
- FR-8.1 Any visitor can calculate an estimated monthly mortgage payment from home price, down payment, interest rate, and term.
- FR-8.2 Signed-in users can run a pre-qualification estimate from income, debts, credit score, and down payment.

## 6. Non-functional requirements

| Category | Requirement |
|---|---|
| **Security** | Session tokens must not be readable by client-side JavaScript (httpOnly cookies only); passwords hashed with bcrypt; role-based authorization enforced server-side for privileged actions |
| **Performance** | List/search endpoints must support pagination (`page`/`limit`, capped at 100 per page) to bound response size |
| **Availability** | Rate limiting applied globally (`apiLimiter`) and more strictly on auth endpoints (`authLimiter`) to reduce abuse/brute-force risk |
| **Data integrity** | All write endpoints validate request bodies against Zod schemas before reaching business logic (where wired — see API reference "known gaps") |
| **Internationalization (partial)** | Currency must default to KSH and support conversion to USD/EUR/GBP; phone numbers must accept Kenyan formats (+254, 0254, 0-prefixed) |
| **Accessibility** | WCAG 2.2 AA target for color contrast, keyboard operability of custom widgets (modals, accordions), and focus management — see the accessibility audit history for current status |
| **Observability** | Structured request logging (Pino) on the backend; health check endpoint (`/health`) for uptime monitoring |

## 7. Success metrics (suggested — not yet instrumented)

- Listing-to-approval time (time a listing spends in `pending` status)
- Inquiry response rate / time-to-first-reply for agents
- Search-to-inquiry conversion rate
- M-Pesa payment success rate

## 8. Assumptions & constraints

- Single-currency-of-record is KSh; other currencies are display conversions, not separately settled.
- Property management (tenancy/maintenance) and developer/off-plan modules are schema-complete but have no dedicated UI — any near-term work in those areas should confirm current API shape against the controllers directly, since request validation isn't fully wired for all of them (see API reference known gaps).
- Deployment targets a single environment per stage (staging/production) via Docker Compose over SSH, per `.github/workflows/deploy.yml` — no Kubernetes/orchestration layer exists today.

## 9. Glossary

- **Listing** — an agent's offer to sell/rent a specific property; has its own approval-status lifecycle independent of the underlying `Property` record.
- **Property** — the physical real-estate record (address, specs) a listing points to.
- **Estate** — a Kenyan neighborhood/suburb-level geography unit, nested under a county/city (Nairobi-focused today).
- **Zestimate** — the platform's estimated property valuation, shown as a value ± range.
