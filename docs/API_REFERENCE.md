# EstateIn API Reference

Base URL (dev): `http://localhost:3000/api`

## Authentication

Auth uses **httpOnly cookies**, not bearer tokens in the response body:

- `POST /auth/register`, `POST /auth/login`, and `POST /auth/refresh-token` set two cookies: `accessToken` (short-lived, sent on every request, path `/`) and `refreshToken` (longer-lived, path scoped to `/api/auth` only).
- Every request must be made with credentials included (`fetch(url, { credentials: "include" })`) so the browser attaches these cookies. There is nothing for client-side JS to read or store — this is intentional, so an XSS bug can't exfiltrate a session token out of `localStorage`.
- `verifyToken` middleware runs globally and attaches `req.user` (`{ id, email, role }`) if a valid access-token cookie (or, as a fallback, an `Authorization: Bearer <token>` header) is present.
- Endpoints marked **requireAuth** reject unauthenticated requests with `401 NOT_AUTHENTICATED`. Endpoints marked **requireRole(admin)** additionally reject non-admins with `403 UNAUTHORIZED`.
- Many endpoints do an **ownership check inside the controller** even though the route only declares `requireAuth` (e.g. "owner or admin") — these are noted per-resource below.

## Response shape

```jsonc
// success
{ "data": { /* ... */ }, "message"?: "optional human message" }

// paginated list
{ "data": [ /* ... */ ], "total": 123, "page": 1, "limit": 20, "pages": 7 }

// error
{
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details"?: {...}, "statusCode": 400 }
}
```

Rate limiting: a global `apiLimiter` applies to all `/api/*` routes; auth-sensitive endpoints (register, login, forgot/reset password) additionally go through a stricter `authLimiter`.

---

## Auth (`/auth`)

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/register` | none | `email`, `password` (≥8 chars, 1 uppercase, 1 digit), `name` (2-100), `phone?`, `role` (`buyer`\|`agent`, default `buyer`), `company?`, `license?`, `licenseState?` |
| POST | `/auth/login` | none | `email`, `password` (≥6) |
| POST | `/auth/refresh-token` | reads `refreshToken` cookie | — |
| POST | `/auth/logout` | requireAuth | — |
| GET | `/auth/me` | requireAuth | — |
| POST | `/auth/forgot-password` | none | `email` |
| POST | `/auth/reset-password` | none | `token`, `newPassword` (≥8, uppercase+digit) |

## Users (`/users`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/users/:id` | requireAuth | Self or admin |
| PUT | `/users/:id` | requireAuth | Self or admin |
| PUT | `/users/:id/password` | requireAuth | Body: `currentPassword`, `newPassword` (≥8, uppercase+digit) |
| GET | `/users/:id/activity` | requireAuth | Activity history |

## Contact (`/contact`)

| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/contact` | none | `firstName`, `lastName` (1-100 each), `email`, `phone?`, `message` (10-2000), `source` (default `"contact"`), `metadata?` |

Used by the marketing site's general lead-capture forms (Contact page, Properties search page) where there's no logged-in buyer or specific property to attach an inquiry to.

## Properties (`/properties`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/properties` (or `/properties/search`) | none | Query: `page`, `limit` (≤100), `minPrice?`, `maxPrice?`, `bedrooms?`, `bathrooms?`, `propertyType?` (`house\|apartment\|townhouse\|plot\|commercial`), `location?`, `radius` (default 5), `listingStatus?` (`for_sale\|for_rent\|sold\|pending`), `sortBy` (`price\|date\|views`, default `date`) |
| GET | `/properties/:id` | optionalAuth | |
| GET | `/properties/slug/:slug` | optionalAuth | |
| POST | `/properties/:id/views` | optionalAuth | Increments view counter |
| GET | `/properties/:id/comparable` | none | Up to 6 similar properties (same city/type, price within ±30%) |
| GET | `/properties/:id/price-history` | none | |
| GET | `/properties/:id/zestimate` | none | Estimated value ±5% range |
| POST | `/properties` | requireAuth | `address`, `city` required; `propertyType`, `beds`/`baths` (int ≥0), `price` (positive), `photos` (1-10 URLs), etc. |
| PUT | `/properties/:id` | requireAuth | Partial update of the same shape |
| DELETE | `/properties/:id` | requireAuth | |

## Listings (`/listings`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/listings` | none | Query: `page`, `limit`, `status?` (`draft\|active\|pending\|sold\|expired\|rejected`), `userId?`, `listingType?` (`for_sale\|for_rent`) |
| GET | `/listings/:id` | none | |
| POST | `/listings` | requireAuth | `title` (5-200), `listingType`, `price` (positive), plus either `propertyId` or a nested `property` object |
| PUT | `/listings/:id` | requireAuth | Owner or admin. `title?`, `description?`, `price?`, `status?` |
| DELETE | `/listings/:id` | requireAuth | Owner or admin |
| PUT | `/listings/:id/status` | requireAuth | Owner or admin. `status` (`active\|pending\|sold\|expired\|rejected`) |
| GET | `/listings/:id/analytics` | requireAuth | Owner or admin |

## Agents (`/agents`)

| Method | Path | Auth |
|---|---|---|
| GET | `/agents` | none |
| GET | `/agents/:id` | none |
| PUT | `/agents/:id` | requireAuth (self) |
| POST | `/agents/:id/contact` | requireAuth |
| GET | `/agents/:id/reviews` | none |
| POST | `/agents/:id/reviews` | requireAuth — `rating` (1-5), `text?` |

## Inquiries (`/inquiries`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/inquiries` | requireAuth | Lists inquiries where current user is buyer or seller; optional `?role=buyer\|seller` |
| GET | `/inquiries/:id` | requireAuth | Buyer, seller, or admin |
| POST | `/inquiries` | requireAuth | `propertyId?`, `listingId?`, `agentId?`, `message` (10-500), `contactMethod` (`email\|phone\|whatsapp\|in_app`), `viewingRequested?`, `viewingDate?`, `viewingTime?`, `proposedOfferPrice?` |
| PUT | `/inquiries/:id/status` | requireAuth | `status` (`new\|read\|responded\|archived`) |
| PUT | `/inquiries/:id/viewing-status` | requireAuth | `viewingStatus` (`requested\|confirmed\|cancelled`) |
| POST | `/inquiries/:id/reply` | requireAuth | `message` (1-1000) |
| DELETE | `/inquiries/:id` | requireAuth | Buyer, seller, or admin |

## Favorites (`/favorites`)

| Method | Path | Auth |
|---|---|---|
| GET | `/favorites` | requireAuth |
| POST | `/favorites/:propertyId` | requireAuth |
| DELETE | `/favorites/:propertyId` | requireAuth |
| GET | `/favorites/:propertyId` | requireAuth — check favorited status |

## Saved searches (`/saved-searches`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/saved-searches` | requireAuth | |
| POST | `/saved-searches` | requireAuth | `name`, `searchType` (`buy\|rent`), `location?`, `radius?`, `filters?`, `alertsEnabled?`, `alertFrequency?` (`daily\|weekly`) |
| PUT | `/saved-searches/:id` | requireAuth | Partial update |
| DELETE | `/saved-searches/:id` | requireAuth | |
| POST | `/saved-searches/:id/alert` | requireAuth | Manually trigger the search alert |

## Admin (`/admin`) — every route requires `requireAuth` + `requireRole("admin")`

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/pending-listings` | |
| PUT | `/admin/listings/:id/approve` | `notes?` |
| PUT | `/admin/listings/:id/reject` | `reason` (required) |
| GET | `/admin/users` | |
| PUT | `/admin/users/:id/status` | `status` (`active\|suspended\|deleted`) |
| GET | `/admin/stats` | |

## Uploads (`/uploads`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/uploads` | requireAuth | `multipart/form-data`, field `file` (JPG/PNG/WEBP, ≤5MB), field `type` (folder name). Returns `{ url, key }`. |
| DELETE | `/uploads/:key` | requireAuth | Owner (by key namespace) or admin |

## Mortgage (`/mortgage`)

| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/mortgage/rates` | none | |
| POST | `/mortgage/calculate` | none | `homePrice`, `downPaymentPercent` (0-100), `interestRate`, `loanTermYears` |
| POST | `/mortgage/pre-qualify` | requireAuth | `income`, `debts`, `creditScore` (300-850), `downPaymentAmount` |

## Market data (`/market`)

| Method | Path | Auth |
|---|---|---|
| GET | `/market/trends/:location` | none |
| GET | `/market/sold/:location` | none |
| GET | `/market/inventory/:location` | none |
| GET | `/market/days-on-market/:location` | none |

## Neighborhoods (`/neighborhoods`)

| Method | Path | Auth |
|---|---|---|
| GET | `/neighborhoods` | none |
| GET | `/neighborhoods/:id` | none |
| GET | `/neighborhoods/:id/demographics` | none |
| GET | `/neighborhoods/:id/schools` | none |

## Payments (`/payments`) — M-Pesa

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/payments/initiate` | requireAuth | Initiates M-Pesa STK push |
| POST | `/payments/mpesa/callback/:callbackToken` | secret path token (`MPESA_CALLBACK_TOKEN`), not JWT | Safaricom server-to-server callback |
| GET | `/payments/:paymentId/status` | requireAuth | |
| GET | `/payments` | requireAuth | Current user's payment history |

## Documents (`/documents`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/documents/upload` | requireAuth | multipart upload |
| GET | `/documents` | requireAuth | Current user's documents |
| DELETE | `/documents/:documentId` | requireAuth | Owner only |
| PATCH | `/documents/:documentId/verify` | requireAuth | Admin only |
| GET | `/documents/property/:propertyId` | none | Documents attached to a property |

## Locations (`/locations`) — Kenya geography reference data

| Method | Path | Auth |
|---|---|---|
| GET | `/locations/counties` | none |
| GET | `/locations/estates` | none |
| GET | `/locations/search` | none |
| POST | `/locations/seed` | requireAuth (admin only) — seeds the 47 counties + Nairobi estates |

## Developer projects (`/developer-projects`, `/project-phases`, `/project-units`)

Off-plan / new-construction modeling: a `DeveloperProject` has many `ProjectPhase`s, each with many `ProjectUnit`s.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/developer-projects` | optionalAuth | |
| GET | `/developer-projects/:id` / `/developer-projects/slug/:slug` | optionalAuth | |
| POST | `/developer-projects` | requireAuth | |
| PUT` / `DELETE` `/developer-projects/:id` | requireAuth | Owner (`developerId`) or admin |
| GET | `/project-phases/project/:projectId`, `/project-phases/:id` | optionalAuth | |
| POST` / `PUT` / `DELETE` `/project-phases/...` | requireAuth | Project owner or admin |
| GET | `/project-units/phase/:phaseId`, `/project-units/:id` | optionalAuth | |
| POST` / `PUT` / `DELETE` `/project-units/...` | requireAuth | Owner or admin |
| POST | `/project-units/:id/reserve` | requireAuth | Only if unit `status === "available"` |

## Property management (`/tenants`, `/maintenance-requests`)

| Method | Path | Auth | Body (create) |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/tenants` | requireAuth | `userId`, `leaseStartDate`, `monthlyRent` (positive), `currency?` (`KSH\|USD\|EUR\|GBP`), `securityDeposit?`, `paymentDay?` (1-31) |
| GET/POST/PUT/DELETE | `/maintenance-requests` | requireAuth | `tenantId`, `title` (1-200), `description` (1-5000), `priority?` (`low\|medium\|high\|urgent`), `photos?` |

## Support tickets (`/support-tickets`)

| Method | Path | Auth | Body (create) |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/support-tickets` | requireAuth | `subject` (1-200), `description` (1-5000), `priority?` (`low\|medium\|high\|critical`) |

Non-admins only see their own tickets; `assignedTo` on update is an admin-triage field.

## System settings (`/system-settings`) — every route requires `requireAuth` + `requireRole("admin")`

| Method | Path |
|---|---|
| GET | `/system-settings`, `/system-settings/:key` |
| POST | `/system-settings`, `/system-settings/bulk` |
| PUT | `/system-settings/:key` |
| DELETE | `/system-settings/:key` |

## Mortgage applications (`/mortgage-applications`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/mortgage-applications` | requireAuth | Non-admins scoped to own |
| GET | `/mortgage-applications/:id` | requireAuth | Owner or admin |
| POST | `/mortgage-applications` | requireAuth | `firstName`/`lastName`, `email`, `phone`, `monthlyIncome`, `loanAmount`, `loanTermYears`, `propertyValue` |
| PUT | `/mortgage-applications/:id` | requireAuth | Owner or admin |
| DELETE | `/mortgage-applications/:id` | requireAuth | Owner or admin |
| PUT | `/mortgage-applications/:id/status` | requireAuth | Admin only. `status` (`draft\|submitted\|under_review\|approved\|conditionally_approved\|rejected\|disbursed\|completed`) |

---

## Known gaps (verify before relying on these)

- **Unmounted routes**: `src/routes/account.ts`, `dataProtection.ts`, `otpAuth.ts`, and `twoFactor.ts` exist in the codebase (account deactivation, GDPR-style data export, OTP login, 2FA) but are **not imported in `src/routes/index.ts`** — they are not reachable at any `/api/...` path today. Treat them as an implemented-but-not-shipped backlog, not live API surface.
- A few create/update routes (`developer-projects`, `project-phases`, `project-units`, `documents`, `system-settings`) don't have a Zod `validate()` schema wired at the route level — the request body isn't formally documented/enforced beyond what the controller does ad hoc. Confirm actual accepted fields against the controller before integrating.
- The `properties` route comments say create/update/delete are "agent/admin only," but the middleware chain only enforces `requireAuth` (no role check at the route level) — any authenticated user can currently hit these endpoints unless the controller enforces role separately. Worth a security follow-up.
