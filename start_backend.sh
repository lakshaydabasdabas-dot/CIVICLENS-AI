#!/bin/bash

# CivicLens AI Backend Startup Script
# This script ensures the FastAPI backend runs reliably

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
PYTHON_BIN="$SCRIPT_DIR/BACKEND/.venv/bin/python"

mkdir -p "$LOG_DIR"

cd "$SCRIPT_DIR/BACKEND"

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Error: Virtual environment not found in BACKEND/.venv"
    echo "Please run: cd BACKEND && python -m venv .venv"
    exit 1
fi

if [ ! -x "$PYTHON_BIN" ]; then
    echo "Error: Python executable not found at $PYTHON_BIN"
    exit 1
fi

# Kill any existing uvicorn processes on port 8000
echo "Checking for existing backend processes..."
pkill -f "uvicorn APP.MAIN:app" || true
sleep 2

# Check if port 8000 is still in use
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Port 8000 is still in use. Force killing..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Start the backend detached from this shell so it survives script exit
echo "Starting CivicLens AI Backend..."
nohup "$PYTHON_BIN" -m uvicorn APP.MAIN:app --host 127.0.0.1 --port 8000 > "$BACKEND_LOG" 2>&1 < /dev/null &
BACKEND_PID=$!

# Verify backend is running
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/api/health/ > /dev/null 2>&1; then
        echo "✅ Backend started successfully on http://127.0.0.1:8000"
        echo "📊 API Documentation: http://127.0.0.1:8000/docs"
        echo "🏥 Health check: http://127.0.0.1:8000/api/health/"
        echo "📝 Logs: $BACKEND_LOG"
        echo ""
        echo "To stop the backend: pkill -f 'uvicorn APP.MAIN:app'"
        exit 0
    fi

    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "❌ Backend exited during startup. Last log lines:"
        tail -20 "$BACKEND_LOG" || true
        exit 1
    fi

    sleep 1
done

echo "❌ Backend failed to become healthy. Last log lines:"
tail -20 "$BACKEND_LOG" || true
exit 1
