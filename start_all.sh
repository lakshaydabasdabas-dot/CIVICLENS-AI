#!/bin/bash

# CivicLens AI Complete Startup Script
# Starts both backend and frontend using the dedicated detached startup scripts

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting CivicLens AI Backend..."
"$SCRIPT_DIR/start_backend.sh"

echo ""
echo "🚀 Starting CivicLens AI Frontend..."
"$SCRIPT_DIR/start_frontend.sh"

echo ""
echo "🎉 CivicLens AI is now running!"
echo ""
echo "🔗 Access URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://127.0.0.1:8000"
echo "   API Docs: http://127.0.0.1:8000/docs"
echo "   Health Check: http://127.0.0.1:8000/api/health/"
echo ""
echo "🛑 To stop everything: ./stop_all.sh"
