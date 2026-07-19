#!/bin/bash
# Switch back to local development mode

echo "🔄 Switching to local development mode..."

# Update backend .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://localhost:5173|g" estate-backend/.env
sed -i "s|APP_URL=.*|APP_URL=http://localhost:3000|g" estate-backend/.env
sed -i "s|MPESA_CALLBACK_URL=.*|MPESA_CALLBACK_URL=http://localhost:3000/api/payments/mpesa/callback|g" estate-backend/.env

# Update frontend .env.local
sed -i "s|VITE_API_URL=.*|VITE_API_URL=http://localhost:3000/api|g" app/.env.local
sed -i "s|VITE_WS_URL=.*|VITE_WS_URL=http://localhost:3000|g" app/.env.local

echo "✅ Switched to local mode!"
echo ""
echo "Backend .env:"
grep -E "FRONTEND_URL|APP_URL|MPESA_CALLBACK_URL" estate-backend/.env
echo ""
echo "Frontend .env.local:"
grep -E "VITE_API_URL|VITE_WS_URL" app/.env.local
