# 🚂 Fix Railway Deployment Issues

## 🚨 Problem Analysis

Railway is trying to build the **frontend** (Next.js) instead of the **backend** (Node.js server). The error shows:
- `npm run build` is being executed (frontend command)
- `next: Permission denied` (trying to run Next.js)
- Railway should only run the server, not build the frontend

## 🔧 Solution: Configure Railway for Backend Only

### Method 1: Use Railway Root Directory Setting (Recommended)

1. **Go to your Railway dashboard**
2. **Click on your service**
3. **Go to "Settings" tab**
4. **Find "Source Repo"**
5. **Set "Root Directory" to: `server`**
6. **Click "Update"**
7. **Redeploy the service**

This tells Railway to only look at the `server` folder, ignoring the frontend.

### Method 2: Add Railway Configuration File

Create this file in your **project root** (not in server folder):

```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd server && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Method 3: Add Nixpacks Configuration

Create this file in your **server folder**:

```toml
# server/nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs", "npm"]

[phases.install]
cmds = ["npm ci"]

[phases.build]
cmds = ["echo 'No build step needed for server'"]

[start]
cmd = "npm start"
```

## 🎯 Correct Railway Setup Steps

### Step 1: Delete Current Service
1. Go to Railway dashboard
2. Click on your current service
3. Go to "Settings" → "Danger" → "Delete Service"

### Step 2: Create New Service Correctly
1. **Click "New Project"**
2. **Select "Deploy from GitHub repo"**
3. **Choose your repository**
4. **⚠️ IMPORTANT: Set Root Directory to `server`**
5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```

### Step 3: Verify Server Package.json

Make sure your `server/package.json` has the correct start script:

```json
{
  "name": "whatsapp-clone-server",
  "version": "1.0.0",
  "description": "Socket.io server for WhatsApp clone",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5"
  }
}
```

## 🐛 Alternative: Manual Deployment Commands

If Railway still has issues, you can override the build process:

### In Railway Dashboard:
1. **Build Command**: `echo "No build needed"`
2. **Start Command**: `npm start`
3. **Root Directory**: `server`

## 🔍 Debugging Railway Issues

### Check Railway Logs:
1. Go to your Railway service
2. Click "Deployments" tab
3. Click on the failed deployment
4. Check the build logs

### Common Issues:

#### Issue 1: Wrong Root Directory
**Symptom**: Trying to build Next.js
**Solution**: Set root directory to `server`

#### Issue 2: Missing Dependencies
**Symptom**: Module not found errors
**Solution**: Ensure `server/package.json` has all dependencies

#### Issue 3: Port Configuration
**Symptom**: Service starts but not accessible
**Solution**: Ensure `PORT` environment variable is set to `3001`

## ✅ Verification Steps

After fixing the deployment:

1. **Check Railway logs** for successful startup
2. **Test health endpoint**: `https://your-railway-url.railway.app/health`
3. **Verify environment variables** are set correctly
4. **Check CORS configuration** matches your Vercel URL

## 🚀 Expected Success Output

When Railway deploys correctly, you should see:
```
✅ Dependencies installed
✅ Server starting on port 3001
✅ CORS Origin: https://your-vercel-app.vercel.app
✅ Socket.io server running
```

## 🔄 Quick Fix Commands

If you want to test locally first:

```bash
# Test server locally
cd server
npm install
npm start

# Should show:
# Server running on port 3001
# CORS Origin: http://localhost:3000
```

## 📝 Railway Configuration Summary

**Correct Settings:**
- **Root Directory**: `server`
- **Build Command**: `npm install` (automatic)
- **Start Command**: `npm start` (automatic)
- **Environment**: 
  - `NODE_ENV=production`
  - `PORT=3001`
  - `CORS_ORIGIN=https://your-vercel-url`

**What Railway Should Deploy:**
- ✅ Only the server code
- ✅ Node.js + Express + Socket.io
- ✅ No frontend building
- ✅ No Next.js dependencies

The key is making sure Railway only sees and deploys the `server` folder! 🎯