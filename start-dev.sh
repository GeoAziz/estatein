#!/bin/bash
# EstateIn Development Startup Script
# Starts all services + ngrok tunnel

set -e

echo "🚀 Starting EstateIn Development Environment..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Install it:"
    echo "   brew install ngrok (macOS)"
    echo "   snap install ngrok (Linux)"
    echo "   Or download from https://ngrok.com/download"
    exit 1
fi

# Check if docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Start Docker Desktop first."
    exit 1
fi

# Check for ngrok config
if grep -q "YOUR_NGROK_AUTH_TOKEN" ngrok.yml; then
    echo "⚠️  Please update ngrok.yml with your credentials:"
    echo "   1. Get auth token: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "   2. Get static domain: https://dashboard.ngrok.com/domains"
    echo "   3. Edit ngrok.yml and replace YOUR_NGROK_AUTH_TOKEN and YOUR_STATIC_DOMAIN"
    exit 1
fi

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
sleep 3

# Run Prisma migrations
echo "🔄 Running database migrations..."
cd estate-backend
npx prisma migrate dev --skip-generate 2>/dev/null || echo "Migrations up to date"
cd ..

# Start backend in background
echo "🔧 Starting backend..."
cd estate-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend in background
echo "🎨 Starting frontend..."
cd app
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for services to start
sleep 3

# Start ngrok
echo "🌐 Starting ngrok tunnels..."
ngrok start --config ngrok.yml estatein-backend estatein-frontend &
NGROK_PID=$!

sleep 2

# Extract ngrok URLs
BACKEND_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print([t['public_url'] for t in json.load(sys.stdin)['tunnels'] if t['name'] == 'estatein-backend'][0])" 2>/dev/null || echo "check http://localhost:4040")
FRONTEND_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; print([t['public_url'] for t in json.load(sys.stdin)['tunnels'] if t['name'] == 'estatein-frontend'][0])" 2>/dev/null || echo "check http://localhost:4040")

echo ""
echo "══════════════════════════════════════════════════════════════"
echo "✅ EstateIn Development Environment Ready!"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo "📍 Local URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3000"
echo "   PgAdmin:   http://localhost:5050 (if enabled)"
echo ""
echo "🌍 Public URLs (ngrok):"
echo "   Frontend:  $FRONTEND_URL"
echo "   Backend:   $BACKEND_URL"
echo "   ngrok UI:  http://localhost:4040"
echo ""
echo "📝 Update these in estate-backend/.env when using ngrok:"
echo "   FRONTEND_URL=$FRONTEND_URL"
echo "   MPESA_CALLBACK_URL=$BACKEND_URL/api/payments/mpesa/callback"
echo "   APP_URL=$BACKEND_URL"
echo ""
echo "📝 Update this in app/.env.local when using ngrok:"
echo "   VITE_API_URL=$BACKEND_URL/api"
echo "   VITE_WS_URL=$BACKEND_URL"
echo ""
echo "Press Ctrl+C to stop all services"
echo "══════════════════════════════════════════════════════════════"

# Cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID $NGROK_PID 2>/dev/null
    docker-compose down
    echo "✅ All services stopped"
}
trap cleanup EXIT INT TERM

# Wait for any process to exit
wait
