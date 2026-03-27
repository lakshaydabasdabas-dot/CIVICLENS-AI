# Cloud Run server.js Fix TODO

## Status: [ ] In Progress

### Step 1: [ ] Add Cloud Run debug logging to server.js
- Log before/after readPort()
- Confirm listen success
- Edit server.js with precise diff

### Step 2: [ ] Test locally  
- Run `PORT=8080 npm start`
- Verify `curl http://localhost:8080/api/health`

### Step 3: [ ] Validate no other issues
- Check Docker build
- Confirm no FRONTEND/dist dependency

### Step 4: [ ] Complete & test deploy
- Redeploy to Cloud Run  
- Verify health endpoint works
