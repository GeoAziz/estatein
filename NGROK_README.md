# Ngrok Setup for EstateIn

## First Time Setup

### 1. Create ngrok account
- Go to https://ngrok.com/signup
- Free tier gives you 1 static domain

### 2. Get your credentials
- Auth token: https://dashboard.ngrok.com/get-started/your-authtoken
- Static domain: https://dashboard.ngrok.com/domains (claim your free domain)

### 3. Update ngrok.yml
Replace these values in `ngrok.yml`:
```yaml
authtoken: YOUR_ACTUAL_AUTH_TOKEN
tunnels:
  estatein-backend:
    domain: YOUR_DOMAIN.ngrok-free.app
  estatein-frontend:
    domain: YOUR_DOMAIN-frontend.ngrok-free.app
```

## Usage

### Start everything with ngrok
```bash
./start-dev.sh
```

### Switch to ngrok URLs
```bash
./use-ngrok.sh https://YOUR_DOMAIN.ngrok-free.app https://YOUR_DOMAIN-frontend.ngrok-free.app
```

### Switch back to local
```bash
./use-local.sh
```

## URLs After Starting

| Service | Local | Ngrok |
|---------|-------|-------|
| Frontend | http://localhost:5173 | https://YOUR_DOMAIN-frontend.ngrok-free.app |
| Backend | http://localhost:3000 | https://YOUR_DOMAIN.ngrok-free.app |
| ngrok UI | http://localhost:4040 | - |

## M-Pesa Callbacks

Update in `estate-backend/.env`:
```
MPESA_CALLBACK_URL=https://YOUR_DOMAIN.ngrok-free.app/api/payments/mpesa/callback
```

## OAuth Redirects

Update these in your Google/Apple developer consoles:
- Google: Add `https://YOUR_DOMAIN.ngrok-free.app/*` to authorized origins
- Apple: Add `https://YOUR_DOMAIN.ngrok-free.app` to allowed redirect URIs

## Troubleshooting

**"ngrok tunnel already running"**
```bash
pkill ngrok
```

**"Failed to bind to port"**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5173
```

**CORS errors**
- Make sure `FRONTEND_URL` in backend `.env` matches your ngrok frontend URL
- Restart backend after changing `.env`
