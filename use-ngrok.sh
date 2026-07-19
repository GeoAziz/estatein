#!/bin/bash
# Quick script to update .env files with ngrok URLs
# Usage: ./use-ngrok.sh <backend-ngrok-url> <frontend-ngrok-url>

if [ $# -ne 2 ]; then
    echo "Usage: ./use-ngrok.sh <backend-ngrok-url> <frontend-ngrok-url>"
    echo ""
    echo "Example:"
    echo "  ./use-ngrok.sh https://abc123.ngrok-free.app https://def456.ngrok-free.app"
    echo ""
    echo "Find your URLs at http://localhost:4040 after starting ngrok"
    exit 1
fi

BACKEND_URL=$1
FRONTEND_URL=$2

echo "🔄 Updating .env files with ngrok URLs..."

# Update backend .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=$FRONTEND_URL|g" estate-backend/.env
sed -i "s|APP_URL=.*|APP_URL=$BACKEND_URL|g" estate-backend/.env
sed -i "s|MPESA_CALLBACK_URL=.*|MPESA_CALLBACK_URL=$BACKEND_URL/api/payments/mpesa/callback|g" estate-backend/.env

# Update frontend .env.local
sed -i "s|VITE_API_URL=.*|VITE_API_URL=$BACKEND_URL/api|g" app/.env.local
sed -i "s|VITE_WS_URL=.*|VITE_WS_URL=$BACKEND_URL|g" app/.env.local

echo "✅ Updated!"
echo ""
echo "Backend .env:"
grep -E "FRONTEND_URL|APP_URL|MPESA_CALLBACK_URL" estate-backend/.env
echo ""
echo "Frontend .env.local:"
grep -E "VITE_API_URL|VITE_WS_URL" app/.env.local
echo ""
echo "⚠️  Restart your dev servers for changes to take effect"
