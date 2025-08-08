# 🚂 How to Get Your Railway Backend URL

## 📍 Step-by-Step: Find Your Railway URL

### Step 1: Go to Railway Dashboard
1. **Open your browser**
2. **Go to [railway.app](https://railway.app)**
3. **Sign in** to your account

### Step 2: Find Your Service
1. **You'll see your projects** on the dashboard
2. **Click on your backend project** (the one you just deployed)
3. **You should see your service** (it might be named after your repository)

### Step 3: Get the URL
1. **Click on your service** (the deployed backend)
2. **Look for the "Deployments" tab** or **"Settings" tab**
3. **Find the "Public URL" or "Domain"** section
4. **Copy the URL** - it looks like:
   - `https://your-app-name.up.railway.app`
   - `https://backend-production-1234.up.railway.app`
   - `https://blockrtc-backend-production-abcd.up.railway.app`

### Visual Guide:
```
Railway Dashboard
├── Your Project Name
    ├── Service (your backend)
        ├── Deployments ← Click here
        │   └── Latest Deployment
        │       └── 🌐 Public URL: https://your-app.up.railway.app
        └── Settings ← Or click here
            └── Domains
                └── 🌐 Generated Domain: https://your-app.up.railway.app
```

## 🧪 Test Your Railway Backend

### Method 1: Browser Test
1. **Copy your Railway URL**
2. **Add `/health` to the end**
3. **Visit:** `https://your-railway-url.up.railway.app/health`
4. **You should see:** 
   ```json
   {
     "status": "healthy",
     "worker": 1234,
     "connections": 0,
     "uptime": 123.45
   }
   ```

### Method 2: Command Line Test
```bash
# Replace with your actual Railway URL
curl https://your-railway-url.up.railway.app/health

# Should return JSON like:
# {"status":"healthy","worker":1234,"connections":0,"uptime":123.45}
```

### Method 3: Browser Developer Tools
1. **Open your Railway URL in browser**
2. **Press F12** (open developer tools)
3. **Go to Network tab**
4. **Refresh the page**
5. **Look for the health endpoint response**

## 🔍 What to Look For

### ✅ Success Indicators:
- **URL loads without errors**
- **Returns JSON response**
- **Status shows "healthy"**
- **No 404 or 500 errors**

### ❌ Problem Indicators:
- **404 Not Found** - Service not deployed properly
- **500 Internal Server Error** - Server crashed
- **Connection timeout** - Service not running
- **CORS errors** - Will fix this later

## 📋 Common Railway URL Patterns

Railway generates URLs like:
- `https://backend-production-1a2b.up.railway.app`
- `https://blockrtc-backend-production-3c4d.up.railway.app`
- `https://your-repo-name-production-5e6f.up.railway.app`

## 🚨 If You Can't Find the URL

### Option 1: Check Railway Logs
1. **Go to your service in Railway**
2. **Click "Deployments"**
3. **Click on the latest deployment**
4. **Look for logs that say:** `Server running on port 3001`
5. **The URL should be shown in the deployment details**

### Option 2: Check Railway Settings
1. **Go to your service**
2. **Click "Settings" tab**
3. **Look for "Domains" section**
4. **Your public URL will be listed there**

### Option 3: Railway CLI (if installed)
```bash
railway status
railway open
```

## 📝 Save Your URLs

Once you find your Railway URL, save it:

```
Backend (Railway): https://your-app.up.railway.app
Health Check: https://your-app.up.railway.app/health
Debug Users: https://your-app.up.railway.app/debug/users
```

## 🔄 Next Steps After Getting URL

1. **Test the health endpoint** ✅
2. **Copy the URL** for Vercel environment variables
3. **Continue with frontend deployment**

## 🆘 Still Can't Find It?

If you're still having trouble:

1. **Take a screenshot** of your Railway dashboard
2. **Look for any service** that shows "Active" or "Deployed"
3. **Click on it** and look for domain/URL information
4. **Check the "Overview" tab** for deployment status

The URL is definitely there once your service is deployed successfully! 🎯