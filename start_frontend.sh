#!/bin/bash

# CivicLens AI Frontend Startup Script
# Starts Vite detached from the shell and verifies that the dev server is reachable

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
FRONTEND_LOG="$LOG_DIR/frontend.log"
FRONTEND_DIR="$SCRIPT_DIR/FRONTEND"

mkdir -p "$LOG_DIR"

cd "$FRONTEND_DIR"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Kill any existing Vite processes
echo "Checking for existing frontend processes..."
pkill -f "vite" || true
sleep 2

# Clear port if needed
if lsof -ti:5173 > /dev/null 2>&1; then
    echo "Port 5173 is still in use. Force killing..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if ! curl -s http://127.0.0.1:8000/api/health/ > /dev/null 2>&1; then
    echo "⚠️  Backend is not reachable on http://127.0.0.1:8000."
    echo "   The frontend will start, but API requests will fail until you run ./start_backend.sh"
fi

# Start the frontend detached from this shell so it survives script exit
echo "Starting CivicLens AI Frontend..."
nohup npm run dev > "$FRONTEND_LOG" 2>&1 < /dev/null &
FRONTEND_PID=$!

# Verify frontend is running
for i in {1..30}; do
    if curl -s http://127.0.0.1:5173 > /dev/null 2>&1; then
        echo "✅ Frontend started successfully on http://localhost:5173"
        echo "📝 Logs: $FRONTEND_LOG"
        exit 0
    fi

    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "❌ Frontend exited during startup. Last log lines:"
        tail -20 "$FRONTEND_LOG" || true
        exit 1
    fi

    sleep 1
done

echo "❌ Frontend failed to become reachable. Last log lines:"
tail -20 "$FRONTEND_LOG" || true
exit 1
