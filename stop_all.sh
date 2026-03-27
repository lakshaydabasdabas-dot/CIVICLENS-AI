#!/bin/bash

# CivicLens AI Stop Script
# Stops all backend and frontend services

echo "🛑 Stopping CivicLens AI services..."

# Stop backend
if pkill -f "uvicorn APP.MAIN:app"; then
    echo "✅ Backend stopped"
else
    echo "ℹ️  Backend was not running"
fi

# Stop frontend
if pkill -f "vite"; then
    echo "✅ Frontend stopped"
else
    echo "ℹ️  Frontend was not running"
fi

# Stop the Express.js mock server if running
if pkill -f "node.*server.js"; then
    echo "✅ Mock server stopped"
fi

# Clear port 8000 if anything is still using it
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "⚠️  Cleaning up port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
fi

# Clear port 5173 if anything is still using it
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "⚠️  Cleaning up port 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
fi

sleep 2
echo "\n✅ All CivicLens AI services have been stopped"