# Production Launch Ops Checklist

**These must be done BEFORE going live.** Each item is a single point of failure that can bring down the entire service.

## 1. SSL Certificate & Domain Routing

- [ ] **SSL Certificate:** Acquire from Let's Encrypt (free) or your provider
  - Use `certbot` for auto-renewal on EC2/DigitalOcean
  - Pin cert renewal to cron: `0 0 1 * * certbot renew --quiet`
  
- [ ] **Domain DNS:** Point your domain to the API server
  - Backend API: `api.yourdomain.com` → backend IP
  - Frontend: `yourdomain.com` → frontend CDN or server
  
- [ ] **HTTPS enforcement:** Update all API calls to use `https://` 
  - Check `.env.production`: `VITE_API_URL=https://api.yourdomain.com`
  - Enable HSTS header in backend security middleware

## 2. Error Tracking (Sentry)

- [ ] **Sentry project:** Create at sentry.io (free tier covers most startups)
  
- [ ] **Backend wiring:**
  ```bash
  npm install @sentry/node
  # In estate-backend/src/app.ts, BEFORE routes:
  import * as Sentry from "@sentry/node";
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
  # AFTER routes:
  app.use(Sentry.Handlers.errorHandler());
  ```
  
- [ ] **Frontend wiring:**
  ```bash
  # Already in app/package.json: @sentry/react
  # In app/src/main.tsx, BEFORE ReactDOM.createRoot:
  import * as Sentry from "@sentry/react";
  Sentry.init({ dsn: process.env.VITE_SENTRY_DSN });
  ```

- [ ] **Environment variables:**
  - Backend `.env.production`: `SENTRY_DSN=https://...@sentry.io/...`
  - Frontend `.env.production`: `VITE_SENTRY_DSN=https://...@sentry.io/...`

## 3. Database Backups

**Postgres on production is a single point of failure. Automate backups NOW.**

- [ ] **Daily backup script** (run via cron on a different server, not prod):
  ```bash
  #!/bin/bash
  BACKUP_DIR="/backups/postgres"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  pg_dump -h prod-db.internal -U postgres estatein > $BACKUP_DIR/estatein_$TIMESTAMP.sql
  gzip $BACKUP_DIR/estatein_$TIMESTAMP.sql
  # Upload to S3
  aws s3 cp $BACKUP_DIR/estatein_$TIMESTAMP.sql.gz s3://your-bucket/backups/
  # Keep only last 30 days
  find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
  ```

- [ ] **S3 bucket for backups:** Create private bucket with lifecycle rules (auto-delete after 30 days)

- [ ] **Restore test:** Actually restore a backup to a test DB quarterly to verify it works

## 4. Environment Variables

**Production env must be locked down.** Use a secrets manager or at minimum encrypted `.env` file.

- [ ] **Backend `.env.production`:**
  ```
  NODE_ENV=production
  DATABASE_URL=postgres://user:pass@prod-db:5432/estatein
  REDIS_URL=redis://prod-redis:6379
  JWT_SECRET=<long-random-string-256-chars>
  MPESA_CONSUMER_KEY=...
  MPESA_CONSUMER_SECRET=...
  MPESA_CALLBACK_URL=https://api.yourdomain.com/api/payments/mpesa/callback
  MPESA_CALLBACK_TOKEN=<random-secret>
  VITE_API_URL=https://api.yourdomain.com
  SENTRY_DSN=...
  ```

- [ ] **Frontend `.env.production`:**
  ```
  VITE_API_URL=https://api.yourdomain.com
  VITE_GOOGLE_MAPS_API_KEY=...
  VITE_SENTRY_DSN=...
  ```

- [ ] **Never commit `.env` files.** Use `.gitignore` + GitHub Secrets for CI

## 5. Health Check Endpoints

**Your load balancer needs to know the API is alive.**

- [ ] **Endpoint already exists:** `GET /health` returns `{ status: "ok" }`
  - Test: `curl https://api.yourdomain.com/health`

- [ ] **Load balancer config:** Set health check to hit `/health` every 10s, fail after 3 misses

## 6. Rate Limiting & DDoS Protection

**Already wired:** `estate-backend/src/middleware/rateLimit.ts`

- [ ] **Verify in production:**
  - Login endpoint: 5 attempts per 15 mins (authLimiter)
  - General API: 100 requests per minute per IP
  
- [ ] **Cloudflare (free tier):** Point DNS through Cloudflare for DDoS protection + free WAF

## 7. Monitoring & Alerting

- [ ] **CPU/Memory:** Set up alerts (AWS CloudWatch, DigitalOcean monitoring, or New Relic free tier)
  - Alert: CPU > 80% for 5+ minutes
  - Alert: Memory > 85%
  
- [ ] **Database:** Monitor connection count, slow queries
  - Postgres: Enable `log_min_duration_statement=1000` to log slow queries

- [ ] **Sentry alerts:** Configure email/Slack notifications for errors in production

## 8. Deployment Checklist (Before Going Live)

- [ ] Run full test suite: `npm test` (both apps)
- [ ] Type check: `npx tsc -b --noEmit`
- [ ] Lint: `npm run lint`
- [ ] Build: `npm run build`
- [ ] Verify all env vars are set (use `printenv | grep MPESA` etc.)
- [ ] Smoke test against staging: manually go through buy/schedule/pay flow
- [ ] Database migrations: `npx prisma migrate deploy`
- [ ] Seed initial data if needed: `npx prisma db seed`

## 9. First Week: Monitor Like a Hawk

- [ ] Check Sentry daily for errors
- [ ] Monitor DB backup logs
- [ ] Check CloudFlare/monitoring for traffic spikes
- [ ] Test payment callbacks (M-Pesa sandbox -> production callback)
- [ ] Have a rollback plan if things break (keep previous Docker image tags)

---

**Definition of Done:** You've done ops right when:
- A database outage takes < 5 minutes to recover from (restore from backup)
- You get a Sentry alert within minutes of a production error
- Your domain has HTTPS working
- You can redeploy without downtime (blue-green or rolling restart)
