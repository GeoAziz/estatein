#!/bin/bash

# EstateIn ngrok setup helper
# This script helps you expose your local dev environment via ngrok

set -e

echo "=========================================="
echo "EstateIn ngrok Setup"
echo "=========================================="
echo ""

# Check if docker-compose is running
echo "[1/4] Checking Docker services..."
if ! docker compose ps | grep -q "postgres"; then
    echo "  ✗ Docker services not running"
    echo "  Starting docker compose..."
    docker compose up -d
    echo "  ✓ Services started. Waiting for health checks..."
    sleep 10
else
    echo "  ✓ Docker services are running"
fi
echo ""

# Check if backend is running
echo "[2/4] Checking backend..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "  ✓ Backend is running (http://localhost:3000)"
else
    echo "  ✗ Backend not running"
    echo "  → Start with: cd estate-backend && npm run dev"
    exit 1
fi
echo ""

# Check if frontend is running
echo "[3/4] Checking frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "  ✓ Frontend is running (http://localhost:5173)"
else
    echo "  ✗ Frontend not running"
    echo "  → Start with: cd app && npm run dev"
    exit 1
fi
echo ""

# Check ngrok
echo "[4/4] Starting ngrok..."
if ! command -v ngrok &> /dev/null; then
    echo "  ✗ ngrok not found"
    echo "  → Install: https://ngrok.com/download"
    exit 1
fi

echo ""
echo "Which tunnel would you like to create?"
echo "  1) Backend only (http://localhost:3000 → ngrok)"
echo "  2) Frontend only (http://localhost:5173 → ngrok)"
echo "  3) Both (two separate ngrok URLs)"
echo ""
read -p "Choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "Starting ngrok tunnel to backend (port 3000)..."
        echo "Share this URL with your team for API access"
        echo ""
        ngrok http 3000
        ;;
    2)
        echo ""
        echo "Starting ngrok tunnel to frontend (port 5173)..."
        echo "Share this URL with your team to access the app"
        echo ""
        echo "⚠️  Remember to update app/.env.local with backend URL:"
        echo "   VITE_API_URL=https://your-backend.ngrok-free.dev/api"
        echo ""
        ngrok http 5173
        ;;
    3)
        echo ""
        echo "Starting ngrok tunnels..."
        echo ""
        echo "Frontend tunnel (open in new terminal):"
        echo "  ngrok http 5173"
        echo ""
        echo "Backend tunnel (open in another new terminal):"
        echo "  ngrok http 3000"
        echo ""
        read -p "Press enter when you're ready to start tunnels..."
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "All systems running! 🚀"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Share your ngrok URL with your team"
echo "  2. Update env vars if using single URL:"
echo "     - app/.env.local: VITE_API_URL=..."
echo "     - estate-backend/.env: FRONTEND_URL=..."
echo ""
echo "Docker dashboard: http://localhost:3001 (Grafana)"
echo "Mail testing: http://localhost:8025 (MailHog)"
echo ""
