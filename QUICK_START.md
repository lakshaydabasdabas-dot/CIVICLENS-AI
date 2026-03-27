# CivicLens AI - Permanent Startup Solution

## Problem Solved

The ECONNREFUSED errors (`connect ECONNREFUSED 127.0.0.1:8000`) were caused by:
1. Backend not running when frontend starts
2. Port conflicts between services
3. No reliable startup mechanism

## New Startup System

I've created a complete startup system that ensures both backend and frontend start reliably:

### Available Scripts:

1. **`./start_all.sh`** - Start both backend and frontend
   - Starts FastAPI backend on port 8000
   - Starts Vite frontend on port 5173
   - Automatic error recovery
   - Logs to `logs/` directory

2. **`./stop_all.sh`** - Stop all services
   - Cleanly stops backend and frontend
   - Clears occupied ports

3. **`./start_backend.sh`** - Start only backend
4. **`./start_frontend.sh`** - Start only frontend

## One-Command Solution

To permanently solve the ECONNREFUSED errors:

```bash
# Make scripts executable (one-time)
chmod +x *.sh

# Start everything with one command
./start_all.sh
```

## Manual Verification

After starting, verify everything works:

```bash
# Check backend health
curl http://127.0.0.1:8000/api/health/

# Check complaints endpoint (was failing)
curl http://127.0.0.1:8000/api/complaints/

# Open frontend in browser
xdg-open http://localhost:5173  # or open manually
```

## Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000
- **API Documentation**: http://127.0.0.1:8000/docs
- **Health Check**: http://127.0.0.1:8000/api/health/

## Why This Works

1. **Port Management**: Scripts check and clear ports before starting
2. **Error Recovery**: Automatic retry if services fail to start
3. **Logging**: All output saved to `logs/` directory
4. **Clean Shutdown**: Proper cleanup on exit
5. **Virtual Environment**: Uses existing `.venv` in BACKEND directory

## Troubleshooting

If you still see ECONNREFUSED:

```bash
# Stop everything and restart
./stop_all.sh
./start_all.sh

# Check logs
tail -f logs/backend.log
```

## Production Ready

For permanent, automatic startup (optional):

```bash
# Install as system service
sudo cp civiclens.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable civiclens.service
sudo systemctl start civiclens.service
```