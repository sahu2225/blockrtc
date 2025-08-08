# 🔧 Add Health Endpoint to Backend

## 🚨 Problem: Missing /health Endpoint

Your server doesn't have a `/health` endpoint, which is why you're getting "Cannot GET /health".

## ✅ Solution: Update Your Backend

### Step 1: Update Your Backend Repository

You need to add the health endpoint to your **backend repository** (the separate one you created for Railway).

#### Option A: Copy Updated server.js
1. **Go to your `blockrtc-backend` repository folder**
2. **Replace the `server.js` file** with the updated version from your main repository
3. **The updated server.js now includes:**
   - ✅ `/health` endpoint
   - ✅ `/` root endpoint  
   - ✅ Better error handling

#### Option B: Add Health Endpoint Manually
Add this code to your `server.js` file in the backend repository, right after the CORS setup:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: connectedUsers ? connectedUsers.size : 0,
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BlockRTC Backend Server',
    status: 'running',
    endpoints: {
      health: '/health',
      debug_users: '/debug/users',
      debug_messages: '/debug/messages/:userId'
    }
  })
})
```

### Step 2: Push to Backend Repository

```bash
# Go to your backend repository
cd blockrtc-backend

# Add the changes
git add .
git commit -m "Add health endpoint and root endpoint"
git push origin main
```

### Step 3: Railway Will Auto-Deploy

Railway will automatically detect the changes and redeploy your service.

## 🧪 Test After Update

Once Railway finishes deploying:

### Test 1: Root Endpoint
```
https://blockrtc-backend-production.up.railway.app/
```
**Should return:**
```json
{
  "message": "BlockRTC Backend Server",
  "status": "running",
  "endpoints": {
    "health": "/health",
    "debug_users": "/debug/users",
    "debug_messages": "/debug/messages/:userId"
  }
}
```

### Test 2: Health Endpoint
```
https://blockrtc-backend-production.up.railway.app/health
```
**Should return:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.45,
  "memory": {...},
  "connections": 0,
  "environment": "production",
  "port": "3001"
}
```

### Test 3: Debug Users
```
https://blockrtc-backend-production.up.railway.app/debug/users
```
**Should return:**
```json
{
  "connectedUsers": [],
  "totalConnections": 0,
  "socketIds": []
}
```

## 🚨 Quick Fix Commands

If you want to quickly update your backend:

```bash
# Navigate to backend repository
cd blockrtc-backend

# Copy updated server.js from main repository
cp ../blockrtc/server/server.js ./server.js

# Commit and push
git add server.js
git commit -m "Add health and root endpoints"
git push origin main
```

## ✅ Success Indicators

After the update, you should see:
- ✅ Root URL shows server info
- ✅ `/health` returns server status
- ✅ `/debug/users` shows connected users
- ✅ Railway logs show successful deployment
- ✅ No "Cannot GET" errors

## 🚀 Next Steps

Once your health endpoint is working:
1. ✅ **Backend health check passes**
2. 🔄 **Deploy frontend to Vercel**
3. 🔄 **Connect frontend to backend**
4. 🔄 **Test complete application**

The health endpoint is essential for monitoring and debugging your deployed application! 🎯