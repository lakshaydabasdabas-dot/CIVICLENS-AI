# Cloud Run Startup Crash Fix

**Crash Points Identified:**
1. fs.existsSync missing FRONTEND/dist → ENOENT  
2. readPositiveInteger called before defined → ReferenceError
3. No startup error handling

## Plan:
1. [ ] Wrap fs.existsSync with try-catch safe fallback
2. [ ] Move env consts after function definitions  
3. [ ] Add startup try-catch → server ALWAYS starts
4. [ ] Test PORT=808
