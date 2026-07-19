# Testing Workflows for Launch

## 1. Real User Test: Viewing Schedule/Reschedule Cycle

**Why:** This is the newest code flow (just wired). Test it with actual humans before launch.

**Duration:** 30 minutes  
**Users needed:** 1 agent + 1 buyer  
**Goal:** Verify end-to-end flow with deposits

### Step 1: Setup (5 min)
1. Agent logs in with `agent@estatein.com` / `Password1`
2. Agent creates a test property listing (use `Properties → Create Listing`)
3. Buyer logs in with `buyer@estatein.com` / `Password1`

### Step 2: Initial Inquiry + Deposit (10 min)
1. Buyer searches and finds agent's property
2. Click "Schedule Viewing"
3. Fill form:
   - Message: "I'd like to schedule a viewing"
   - Date: 2 days from now
   - Time: 2:00 PM
   - **Check:** "Secure with M-Pesa deposit" → KSh 2,000
4. **Observe:**
   - ✅ Inquiry sent confirmation
   - ✅ M-Pesa STK prompt appears on phone (or simulator)
   - ✅ SMS sent to buyer's phone
5. **Pay the M-Pesa deposit** (use sandbox credentials if available, or mock)

### Step 3: Agent Confirms Viewing (5 min)
1. Agent goes to `Dashboard → Inquiries`
2. Sees buyer's inquiry with deposit status
3. Clicks "Confirm Viewing" 
4. **Observe:**
   - ✅ Agent gets SMS/in-app notification
   - ✅ Buyer gets SMS/in-app notification (SMS says "confirmed for [date/time]")
   - ✅ Inquiry status shows "confirmed" on buyer dashboard

### Step 4: Buyer Reschedules (5 min)
1. Buyer goes to `Dashboard → Inquiries`
2. Clicks "Reschedule" on confirmed inquiry
3. Picks new date: 3 days from now, 4:00 PM
4. **Observe:**
   - ✅ Reschedule submitted
   - ✅ Viewing status reverts to "requested"
   - ✅ Agent gets SMS/notification of reschedule request
   - ✅ Agent can confirm or reject the new time

### Step 5: Failure Cases (test these separately if time)
- **Payment timeout:** Cancel M-Pesa prompt, confirm inquiry still sends
- **Network error:** Kill internet mid-form, check error message appears
- **Duplicate inquiry:** Submit same form twice, verify only one created

**Success criteria:**
- [ ] All SMS/notifications arrive within 30 seconds
- [ ] UI state matches backend state (no stale data)
- [ ] Buyer can't contact agent without signing in
- [ ] Deposit shows correctly in payment history

---

## 2. Load Test: Property Browse + Inquiry Submission

**Why:** Know your limits before traffic hits.

**Goal:** 100 concurrent users can browse + 10 can submit inquiries without timeouts

### Tool: Apache JMeter or k6

#### Using k6 (recommended — simpler):

```bash
npm install -g k6

# Create load-test.js (see below)
k6 run load-test.js --vus 100 --duration 5m
```

#### load-test.js:
```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(99)<1000'], // 99% of requests < 1s
    http_req_failed: ['rate<0.1'],      // Error rate < 10%
  },
};

export default function () {
  group('Browse properties', () => {
    const res = http.get('https://estatein.yourdomain.com/api/properties?limit=10');
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
  });
  sleep(1);

  group('Create inquiry (authenticated)', () => {
    // Note: requires auth token in header
    const payload = JSON.stringify({
      propertyId: 'prop_1',
      message: 'Test inquiry',
      viewingRequested: true,
      viewingDate: '2026-08-20',
      viewingTime: '2:00 PM',
      contactMethod: 'Email',
      phone: '0712345678',
    });
    const res = http.post('https://api.estatein.yourdomain.com/api/inquiries', payload, {
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <token>' },
    });
    check(res, {
      'inquiry created': (r) => r.status === 201,
    });
  });
  sleep(2);
}
```

**Success criteria:**
- [ ] p99 response time < 1 second
- [ ] Error rate < 10% (some auth token issues expected)
- [ ] Database CPU < 60%
- [ ] No connection pool exhaustion errors

---

## 3. Mobile Responsiveness Test

**Goal:** Works on phones without horizontal scrolling or broken inputs

### Test Devices:
- [ ] iPhone 12 (iOS Safari)
- [ ] Samsung Galaxy S20 (Chrome)
- [ ] Tablet (iPad)

### Test Cases:

1. **Home page:**
   - [ ] Hero image loads, no horizontal scroll
   - [ ] CTA buttons are tappable (≥ 48x48px)

2. **Property browse:**
   - [ ] Property cards stack vertically
   - [ ] Filters sidebar is accessible (collapse/expand)
   - [ ] Images lazy-load (don't scroll too far down)

3. **Property details:**
   - [ ] Images carousel works with swipe
   - [ ] "Schedule Viewing" button visible without scroll
   - [ ] Form inputs (date, time, phone) are readable

4. **Inquiry modal:**
   - [ ] Modal doesn't exceed screen width
   - [ ] Text input focus keyboard appears
   - [ ] Can scroll inside modal to see all fields

5. **Login/Signup:**
   - [ ] Form inputs are full width
   - [ ] Password visibility toggle is tappable
   - [ ] Submit button doesn't overlap keyboard

**Tool:** Browser DevTools device emulation, or actual phones  
**Document:** Screenshot failures with `<1920px viewport` and fix them

---

## 4. Expand Booking Tests

**Current state:** Basic viewing status update tested  
**Target:** Full lifecycle (request → confirm → reschedule → cancel)

Add to `estate-backend/src/__tests__/inquiries.test.ts`:

```typescript
describe("PUT /api/inquiries/:id/viewing-status", () => {
  it("allows agent to confirm viewing", async () => { /* done */ });
  
  it("sends SMS confirmation to buyer", async () => { 
    // Verify SMS provider was called with correct message
  });

  it("blocks unauthorized users from confirming", async () => {
    // Random user tries to confirm inquiry they're not on
  });
});

describe("PUT /api/inquiries/:id/viewing-schedule (reschedule)", () => {
  it("resets status to requested after reschedule", async () => { /* done */ });
  
  it("notifies agent of reschedule request", async () => {
    // Check notification.create was called
  });

  it("prevents rescheduling inquiries that never had viewing requested", async () => { });

  it("validates new date is in the future", async () => {
    // Try to reschedule to yesterday
  });
});

describe("DELETE /api/inquiries/:id (cancel viewing)", () => {
  it("cancels an inquiry and notifies both parties", async () => {});
});
```

---

## 5. API Contract Tests

**Goal:** Before each deploy, verify API responses match what frontend expects

**Run before deploy:**
```bash
cd estate-backend
npm test
# Currently: 32 tests pass
# Target: 50+ tests (cover all CRUD + error cases)
```

**Add tests for:**
- [ ] `POST /api/payments/initiate` (all error cases: invalid amount, no phone, network timeout)
- [ ] `GET /api/payments/:id/status` (payment in progress vs completed vs failed)
- [ ] `POST /api/inquiries` with and without deposits
- [ ] `PUT /api/inquiries/:id/viewing-status` (agent-only action)
- [ ] `PUT /api/inquiries/:id/viewing-schedule` (reschedule validation)

---

## 6. Payment Fallback (Card/Bank Transfer)

**Problem:** M-Pesa STK fails or user doesn't want mobile payment  
**Solution:** Add card payment via Stripe or Paystack (Africa-focused)

For MVP, simplest approach:
1. Add checkbox in deposit modal: "Pay via card instead"
2. If selected, show:
   ```
   Deposit not yet available for card payments.
   Please complete the deposit via M-Pesa on your phone.
   Alternative: Contact agent directly at [phone/email]
   ```
3. This unblocks flow without needing full Stripe integration yet

**Future:** Integrate Stripe/Paystack when ready (1-2 day task)

---

## 7. SEO Verification

**Live checklist (do after domain is live):**

1. **robots.txt:**
   ```bash
   curl https://yourdomain.com/robots.txt
   # Should allow Googlebot, disallow /admin
   ```

2. **Sitemap:**
   ```bash
   curl https://yourdomain.com/sitemap.xml
   # Should list 24+ URLs
   ```

3. **Google Search Console:**
   - [ ] Domain ownership verified
   - [ ] Sitemap submitted
   - [ ] No indexing errors
   - [ ] Mobile-friendly test passing

4. **Meta tags:**
   - [ ] Home page has og:image (hero image)
   - [ ] Property detail pages have og:title and description

**Check:**
```bash
curl -I https://yourdomain.com | grep -E "Content-Type|X-|Cache"
# Verify Cache-Control, X-Frame-Options, etc.
```

---

## 8. Dead Code Cleanup

**Remove:**
- [ ] `app/src/lib/store.ts` (legacy localStorage mock, unused)
- [ ] Backend OTP routes (already removed import, but check for lingering code)
- [ ] Unused dashboard nav items (dev dashboard removed)
- [ ] Test leftover console.logs

**Check:**
```bash
npm run lint  # should have 0 errors (warnings OK)
```

---

## 9. Documentation (README)

**Create or update:**
- [ ] `README.md` with: architecture diagram, setup steps, env var list, deployment guide
- [ ] `CLAUDE.md` — already in place, ensure it's accurate for your team
- [ ] `LAUNCH_OPS_CHECKLIST.md` — created above
- [ ] Quick start: "I want to run this locally" should take ≤ 10 minutes

---

## Pre-Launch Checklist (72 hours before going live)

- [ ] Run all tests: `npm test` in both apps (0 failures)
- [ ] Typecheck: `npx tsc -b --noEmit` (0 errors)
- [ ] Lint: `npm run lint` (0 errors, warnings OK)
- [ ] Build: `npm run build` (succeeds, no errors)
- [ ] Real user test: viewing schedule/reschedule cycle passes
- [ ] Load test: p99 < 1s, error rate < 10%
- [ ] Mobile test: all 5 flows work on iPhone + Android
- [ ] SEO ready: robots.txt, sitemap.xml, og tags live
- [ ] Ops ready: Sentry DSN set, backup script running, SSL cert valid
- [ ] One final smoke test: live at `https://staging.yourdomain.com`, go through full buy/schedule/pay flow

**If anything fails:** Fix it, re-test that specific area, don't ship.
