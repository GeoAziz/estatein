# ngrok Exposure Setup for EstateIn

Expose your local development environment via ngrok with minimal configuration.

## Architecture

Your dev setup:
- **Frontend** — Vite dev server on `localhost:5173` (local `npm run dev`)
- **Backend** — Express server on `localhost:3000` (local `npm run dev`)
- **Docker Services** — Postgres, Redis, Elasticsearch, Grafana, etc. (managed by docker-compose)

ngrok exposes these locally running services to the internet.

---

## Quick Start (Recommended: Multiple Tunnels)

### **Step 1: Start Docker support services**
```bash
docker compose up -d

# Verify services are running
docker compose ps
```

Services to expect:
- ✓ postgres (port 5433)
- ✓ redis (port 6380)  
- ✓ elasticsearch (port 9200)
- ✓ grafana (port 3001)
- ✓ mailhog (port 8025)

### **Step 2: Start frontend locally**
```bash
cd app
npm install  # if needed
npm run dev
# Runs on http://localhost:5173
```

### **Step 3: Start backend locally**
```bash
cd estate-backend
npm install  # if needed

# Ensure .env is set
cp .env.example .env

npm run dev
# Runs on http://localhost:3000
```

### **Step 4: Create ngrok tunnels**

**Terminal A: Frontend tunnel**
```bash
ngrok http 5173 --url=your-frontend.ngrok-free.dev
# Share this URL with your team: https://your-frontend.ngrok-free.dev
```

**Terminal B: Backend tunnel**
```bash
ngrok http 3000 --url=your-backend.ngrok-free.dev
# Share this URL with your team: https://your-backend.ngrok-free.dev
```

### **Step 5: Update frontend to use ngrok backend URL**

In `app/.env.local`:
```env
VITE_API_URL=https://your-backend.ngrok-free.dev/api
```

Then restart the frontend dev server.

---

## Alternative: Single URL via Local nginx (Advanced)

If you prefer a single public URL (`https://my-app.ngrok-free.dev` for everything):

### **Step 1-3:** Same as above

### **Step 4: Create local nginx reverse proxy**

Install nginx (or use Docker):
```bash
# macOS
brew install nginx

# Linux
sudo apt-get install nginx
```

Create `/usr/local/etc/nginx/nginx.conf` (or `/etc/nginx/nginx.conf`):
```nginx
events { worker_connections 1024; }
http {
  upstream frontend { server localhost:5173; }
  upstream backend { server localhost:3000; }
  
  server {
    listen 8080;
    server_name _;
    client_max_body_size 50M;
    
    location /api { proxy_pass http://backend; }
    location / { proxy_pass http://frontend; }
  }
}
```

Start nginx:
```bash
nginx  # or: sudo nginx
```

### **Step 5: Expose via ngrok**
```bash
ngrok http 8080
# Single URL: https://your-app.ngrok-free.dev
```

### **Step 6: Update environment variables**
```env
# app/.env.local
VITE_API_URL=https://your-app.ngrok-free.dev/api

# estate-backend/.env
FRONTEND_URL=https://your-app.ngrok-free.dev
```

---

## Troubleshooting

### "Cannot connect to API"
- ✗ Backend not running: `cd estate-backend && npm run dev`
- ✗ ngrok URL mismatch: Ensure `VITE_API_URL` in `.env.local` matches your ngrok backend URL
- ✗ Backend CORS issue: Check `FRONTEND_URL` in backend `.env` matches ngrok frontend URL

### "Frontend shows loading forever"
- ✗ Vite dev server not running: `cd app && npm run dev`
- ✗ ngrok tunnel to 5173 not active
- ✗ Browser cache: Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### "502 Bad Gateway" from ngrok
- ngrok URL correct but service not responding
- Check: `curl http://localhost:5173` (frontend) and `curl http://localhost:3000/api/health` (backend)
- Restart the service if needed

### "Rate limited" on ngrok free plan
- Free plan has request limits
- Upgrade to ngrok Pro for higher limits: https://ngrok.com/pricing
- Or use Cloudflare Tunnel (free alternative): https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

---

## Sharing with your team

Once ngrok tunnels are active, share:
- **Frontend:** `https://your-frontend-url.ngrok-free.dev`
- **Backend API:** `https://your-backend-url.ngrok-free.dev/api`

Demo accounts (backend):
- Email: `admin@estatein.com`
- Password: `Password1`

Team members can visit the frontend URL and interact with your live dev environment.

---

## Keeping tunnels running

- ngrok connections are active as long as the terminal is open
- If terminal closes, tunnel stops immediately
- Run in a long-lived terminal or use `tmux`/`screen` if needed
- For always-on: upgrade to ngrok Pro with reserved domains and webhooks

---

## Next: Production Deploy

When ready to deploy:
- **Frontend:** Vercel, Netlify, or AWS S3 + CloudFront
- **Backend:** Railway, Render, AWS AppRunner, or your own server
- **Database:** AWS RDS, Supabase, or managed PostgreSQL
- **DNS:** Point to your deployed services (not ngrok, which is dev-only)

ngrok is great for development sharing — not recommended for production.
