# EstateIn User Guide

This is a how-to guide for people actually using the EstateIn site — as a buyer/renter, an agent, or an admin. For what the product is and why, see [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md). For engineering documentation, see [/CLAUDE.md](../CLAUDE.md) and [API_REFERENCE.md](./API_REFERENCE.md).

## For buyers & renters

### Finding a property
1. Go to **Properties** (or **For Sale** / **For Rent** / **New Construction** / **Coming Soon** for a pre-filtered view).
2. Use the search box for a free-text match on name, location, or type, or set the **Location**, **Property Type**, and **Pricing Range** filters and click **Find Property**.
3. Click into any property card to see full details: price breakdown, features, comparable homes nearby, price history, and an estimated value.
4. Prefer a map? Use **Map Search** to browse properties geographically.

### Saving and comparing properties
- Click **Compare** on a property card to add it to your comparison tray (up to 4 at once). A bar appears at the bottom of every page showing your current selection — click **Compare Now** once you have 2 or more to see them side by side.
- Sign in to save properties to **Favorites** and to create **Saved Searches** (with optional alerts) from your buyer dashboard.

### Contacting an agent
- On a property page, use **Contact Agent** to open the inquiry form — you can ask a question and, optionally, request a viewing (pick a date and time). This requires being signed in, since the agent needs to reply to you inside the platform.
- The **Inquire About [Property]** form further down the page is a lighter-weight version of the same thing.
- The general **Contact Us** page and the inquiry form at the bottom of the **Properties** search page don't require an account — they go to EstateIn's team directly rather than a specific agent, for general questions or "I'm looking for X, help me find it" requests.

### Your dashboard (after signing in as a buyer)
- **My Favorites** — properties you've saved.
- **Saved Searches** — your stored filter combinations, with alerts if enabled.
- **My Inquiries** — every inquiry you've sent and its status (new / read / responded / archived), plus any viewing you've requested.
- **Scheduled Viewings** — upcoming viewings pulled from your inquiries.
- **Settings** — update your profile, notification preferences, and privacy settings.

### Other tools
- **Mortgage Calculator** — estimate a monthly payment from home price, down payment, interest rate, and term.
- **Market Trends** — price trend, inventory, and days-on-market data by location.
- **Buying / Selling / Rental Guides** — educational content.

## For agents

### Signing up
Choose **Agent** when you sign up (`/signup?role=agent`) and provide your brokerage/license details. You'll land on the agent dashboard.

### Listing a property
1. From your dashboard, click **Add New Property** to open the listing wizard.
2. **Step 1 — Basic Info**: property name, type, address, price, beds/baths, size, for-sale-or-rent status (and lease term if renting).
3. **Step 2 — Photos**: drag and drop or browse for 3–10 photos (JPG/PNG/WEBP, up to 5MB each). Photos upload as you add them — wait for the upload spinner to clear before continuing.
4. **Step 3 — Details**: description, features/amenities checklist, year built, condition.
5. **Step 4 — Review**: confirm the summary, check the three confirmation boxes (accurate info, terms, right to list), and **Publish**. New listings go to **pending** status until an admin approves them.

### Managing listings
From **My Listings** you can filter by status, search, sort, and:
- **Edit** a listing (reopens the wizard with existing data)
- **Duplicate** a listing (useful for near-identical units)
- **Mark as Sold**
- **Delete**
- Select multiple listings for bulk **delete** or bulk **mark as sold**

### Handling inquiries
**Inquiries** (your inbox) lists every buyer message across all your listings. Open a conversation to see the buyer's message, viewing request (if any), and contact preference; reply inline. Use the **New** / **Replied** tabs and search to triage a busy inbox.

### Tracking performance
Your dashboard's overview shows total views/favorites across listings, and each listing has its own analytics for views, favorites, and inquiry count.

## For admins

### Reviewing pending listings
The **Pending Listings** table on your dashboard lists every listing awaiting approval. **Approve** or **Reject** individually, or select several and **Approve Selected** in bulk. Rejecting notifies the listing's agent.

### Managing users
The **Users** table shows recently registered users with role and active/inactive status.

### Platform stats
Your dashboard's stat cards show total users, total listings, pending approvals, and active listings at a glance.

### Reported content
The **Reported Listings/Users** section is reserved for a moderation/reporting feature that doesn't have a reporting mechanism wired up yet on the frontend — there's currently nothing for users to report content with, so this section will typically show "No reports right now."

## Account & settings (all roles)

- **Settings** lets you update your name, phone, bio, and (for agents) company/license info, plus email and push notification preferences and privacy toggles (profile visibility, phone visibility, WhatsApp contact).
- **Forgot your password?** Use **Forgot Password** on the login page to request a reset link by email.
- Session cookies expire automatically; if you're logged out unexpectedly, just sign in again.
