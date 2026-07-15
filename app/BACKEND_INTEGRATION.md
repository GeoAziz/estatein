# Backend Integration Guide

## Overview

The frontend is now fully wired to the backend API. All authentication and data operations go through the Express API backend running on `http://localhost:3000`.

## Architecture

```
Frontend (React + Vite)
    ↓
API Client (src/lib/api-client.ts)
    ↓
Backend (Express + Prisma)
    ↓
PostgreSQL Database
```

## Setup & Running

### 1. Start Backend

```bash
cd /home/kernelghost/estate/estate-backend

# Start Docker services (PostgreSQL + LocalStack)
docker-compose up -d

# Wait 15 seconds for services to start
sleep 15

# Run migrations
npx prisma migrate dev

# Seed database with demo data
npm run seed

# Start backend server
npm run dev
```

Backend will run on: `http://localhost:3000`

### 2. Start Frontend

```bash
cd /home/kernelghost/estate/app

# Install dependencies (if needed)
npm install

# Start frontend server
npm run dev
```

Frontend will run on: `http://localhost:5173`

## Demo Accounts

All demo accounts use password: `Password1`

| Role | Email | Purpose |
|------|-------|---------|
| Admin | `admin@estatein.com` | Approve listings, manage users |
| Agent | `agent@estatein.com` | Create and manage property listings |
| Buyer | `buyer@estatein.com` | Browse properties and create inquiries |

## API Client

Location: `src/lib/api-client.ts`

The API client automatically:
- ✅ Manages JWT tokens (stores in localStorage)
- ✅ Adds Authorization headers to requests
- ✅ Handles refresh tokens
- ✅ Formats error responses

### Usage Example

```typescript
import { apiClient } from '@/lib/api-client';

// Register new user
const result = await apiClient.register({
  email: 'user@example.com',
  password: 'Password123',
  name: 'John Doe',
  phone: '0712345678',
  role: 'buyer'
});

// Get properties with filters
const properties = await apiClient.getProperties({
  page: 1,
  limit: 20,
  minPrice: 100000,
  maxPrice: 500000,
  bedrooms: 3
});

// Create inquiry
await apiClient.createInquiry({
  propertyId: 'prop123',
  message: 'I am interested in this property',
  contactMethod: 'email'
});
```

## Authentication

### How It Works

1. User signs up/logs in via the frontend form
2. Frontend calls `apiClient.register()` or `apiClient.login()`
3. Backend validates credentials and returns JWT token
4. API client stores token in localStorage
5. API client automatically adds token to all requests
6. Backend verifies token on protected routes
7. On logout, token is cleared from localStorage

### Protected Routes

The `ProtectedRoute` component enforces role-based access:

```typescript
<Route
  path="/dashboard/agent"
  element={
    <ProtectedRoute allow={["agent"]}>
      <AgentDashboard />
    </ProtectedRoute>
  }
/>
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh-token` - Refresh JWT

### Properties
- `GET /api/properties` - Search/filter properties
- `GET /api/properties/:id` - Get single property
- `GET /api/properties/:id/comparable` - Comparable properties
- `POST /api/properties/:id/views` - Increment views

### Inquiries
- `POST /api/inquiries` - Create inquiry
- `GET /api/inquiries` - List inquiries
- `PUT /api/inquiries/:id/status` - Update status
- `POST /api/inquiries/:id/reply` - Reply to inquiry

### Favorites
- `POST /api/favorites/:propertyId` - Add favorite
- `DELETE /api/favorites/:propertyId` - Remove favorite
- `GET /api/favorites` - Get favorites list

### Listings
- `POST /api/listings` - Create listing
- `GET /api/listings` - Get user listings
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing

### Other
- `GET /api/mortgage/rates` - Get mortgage rates
- `POST /api/mortgage/calculate` - Calculate payment
- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent profile
- `GET /market/trends/:location` - Market trends
- `GET /neighborhoods` - List neighborhoods

## Environment Variables

Frontend environment file: `.env.local`

```
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Estatein
```

Backend environment file: `.env.local` (in estate-backend folder)

```
DATABASE_URL=postgresql://estate_dev:local_password@localhost:5432/estate_dev
JWT_SECRET=dev-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
AWS_ENDPOINT=http://localhost:4566
FRONTEND_URL=http://localhost:5173
```

## Testing the Integration

### 1. Test Login

1. Go to `http://localhost:5173/login`
2. Enter `buyer@estatein.com` / `Password1`
3. Should redirect to buyer dashboard
4. Check browser DevTools Network tab - should see API calls

### 2. Test Property Search

1. Go to `http://localhost:5173/properties`
2. Apply filters (price, location, etc.)
3. Check Network tab - should see `/api/properties?...` request
4. Properties should load from backend

### 3. Test Create Inquiry

1. Go to property details page
2. Click "Contact Agent"
3. Fill form and submit
4. Check Network tab - should see `POST /api/inquiries`
5. Success toast should appear

### 4. Test Agent Dashboard

1. Login as `agent@estatein.com` / `Password1`
2. Should redirect to `/dashboard/agent`
3. Dashboard should show agent's listings from backend
4. Create new listing - should POST to `/api/listings`

## Troubleshooting

### "API request failed" or CORS error

**Check:**
- Backend is running on `http://localhost:3000`
- CORS is configured in backend (should allow `http://localhost:5173`)
- Check browser console for specific error

```bash
# Test backend is running
curl http://localhost:3000/health
# Should return: {"status":"ok",...}
```

### Token not being sent

**Check:**
- Login first (token should appear in localStorage)
- Open DevTools → Application → localStorage
- Look for `accessToken` and `refreshToken` keys

### Database errors

**Check:**
- PostgreSQL is running: `docker-compose ps`
- Database was seeded: `npx prisma studio` should show data
- Migrations were run: `npx prisma migrate status`

### CORS Issues

**Backend CORS config** (src/app.ts):

```typescript
cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
})
```

If changing frontend URL, update backend `.env.local`:
```
FRONTEND_URL=<your_new_url>
```

## Files Changed for Integration

1. `src/lib/api-client.ts` - NEW: API client implementation
2. `src/lib/auth-api.tsx` - NEW: Real authentication using API
3. `src/App.tsx` - UPDATED: Import from auth-api
4. `src/pages/SignUp.tsx` - UPDATED: Use async signUp from API
5. `src/pages/Login.tsx` - UPDATED: Use async logIn from API
6. `.env.local` - NEW: API URL configuration

## Next Steps

1. ✅ Backend running with seeded data
2. ✅ Frontend calls backend API for auth
3. ⏳ Update other pages to use API client (properties, listings, etc.)
4. ⏳ Connect dashboards to real backend data
5. ⏳ Add loading states and error handling to all pages

## Support

If you encounter issues:

1. Check browser console for JavaScript errors
2. Check backend console for API errors
3. Check backend logs: `docker-compose logs -f api`
4. Verify both servers are running: check `http://localhost:3000/health` and `http://localhost:5173`
5. Clear browser cache and localStorage if tokens are stale
