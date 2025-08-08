# BlockRTC Deployment: Vercel + Railway Guide

## 🚀 Step-by-Step Deployment Process

### Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free tier available)
- Your code pushed to GitHub

## 📋 Pre-Deployment Checklist

### 1. Prepare Your Repository
```bash
# Make sure your code is committed and pushed
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### 2. Update Frontend Configuration
Create/update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
}

module.exports = nextConfig
```

### 3. Update Server for Railway
Update `server/package.json` to ensure proper start command:
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
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🚂 Part 1: Deploy Backend to Railway

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your account

### Step 2: Deploy Backend
1. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your BlockRTC repository

2. **Configure Service**
   - Railway will detect your repository
   - Click "Add variables" to set environment variables
   - Set the root directory to `server` (important!)

3. **Environment Variables for Railway**
   ```
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
   
   **Note**: You'll update `CORS_ORIGIN` after deploying to Vercel

4. **Deploy Settings**
   - Build Command: `npm install` (automatic)
   - Start Command: `npm start` (automatic)
   - Root Directory: `server`

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your Railway app URL (e.g., `https://your-app.up.railway.app`)

### Step 3: Test Backend
```bash
# Test your Railway backend
curl https://your-app.up.railway.app/health

# Should return something like:
# {"status":"healthy","worker":1234,"connections":0,"uptime":123.45}
```

## ▲ Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Import Project
1. **Import Repository**
   - Click "New Project"
   - Import your BlockRTC repository from GitHub
   - Vercel will auto-detect it's a Next.js project

2. **Configure Build Settings**
   - Framework Preset: `Next.js` (auto-detected)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Environment Variables**
   Add these environment variables in Vercel:
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-railway-app.up.railway.app
   NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build and deployment
   - Get your Vercel app URL (e.g., `https://your-app.vercel.app`)

### Step 3: Update Railway CORS
1. Go back to Railway dashboard
2. Update the `CORS_ORIGIN` environment variable:
   ```
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```
3. Redeploy the Railway service

## 🔧 Configuration Files

### Create `.env.local` (for local development)
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Create `.env.example` (for documentation)
```env
NEXT_PUBLIC_SOCKET_URL=your_railway_backend_url
NEXT_PUBLIC_APP_URL=your_vercel_frontend_url
NEXT_PUBLIC_ENVIRONMENT=production
```

### Update `server/server.js` for Production
Add this at the top of your server file:
```javascript
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const server = http.createServer(app)

// Production CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000"
console.log('CORS Origin:', corsOrigin)

const io = socketIo(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.use(cors({
  origin: corsOrigin,
  credentials: true
}))
```

## 🧪 Testing Your Deployment

### 1. Test Backend Health
```bash
curl https://your-railway-app.up.railway.app/health
```

### 2. Test Frontend
1. Open `https://your-vercel-app.vercel.app`
2. Connect MetaMask wallet
3. Try adding a contact
4. Send a test message

### 3. Test WebSocket Connection
Open browser console and check for:
```
✅ Socket connected
✅ User joined successfully
```

## 🐛 Common Issues & Solutions

### Issue 1: CORS Errors
**Symptoms**: "CORS policy" errors in browser console
**Solution**:
1. Verify `CORS_ORIGIN` in Railway matches your Vercel URL exactly
2. Redeploy Railway service after changing environment variables
3. Check browser network tab for actual URLs being called

### Issue 2: WebSocket Connection Failed
**Symptoms**: "WebSocket connection failed" in console
**Solution**:
1. Verify Railway backend is running: `curl https://your-railway-app.up.railway.app/health`
2. Check `NEXT_PUBLIC_SOCKET_URL` in Vercel environment variables
3. Ensure Railway service is not sleeping (upgrade to paid plan if needed)

### Issue 3: Build Failures on Vercel
**Symptoms**: Build fails with TypeScript or ESLint errors
**Solution**:
Add to `next.config.js`:
```javascript
module.exports = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}
```

### Issue 4: Railway Service Sleeping
**Symptoms**: First request takes 30+ seconds
**Solution**:
1. Upgrade to Railway Pro plan ($5/month)
2. Or implement a keep-alive ping from Vercel
3. Add this to your frontend:
```javascript
// Keep Railway service awake
useEffect(() => {
  const keepAlive = setInterval(() => {
    fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/health`)
      .catch(() => {}) // Ignore errors
  }, 14 * 60 * 1000) // Every 14 minutes

  return () => clearInterval(keepAlive)
}, [])
```

## 📊 Monitoring Your Deployment

### Vercel Analytics
1. Go to your Vercel dashboard
2. Click on your project
3. Go to "Analytics" tab
4. Monitor page views, performance, and errors

### Railway Logs
1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click "View Logs" to see real-time logs

### Custom Health Monitoring
Add this to your frontend:
```javascript
// components/HealthCheck.tsx
import { useEffect, useState } from 'react'

export default function HealthCheck() {
  const [backendHealth, setBackendHealth] = useState('checking')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/health`)
        if (response.ok) {
          setBackendHealth('healthy')
        } else {
          setBackendHealth('unhealthy')
        }
      } catch (error) {
        setBackendHealth('error')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className={`fixed top-4 right-4 px-3 py-1 rounded text-sm ${
      backendHealth === 'healthy' ? 'bg-green-100 text-green-800' :
      backendHealth === 'unhealthy' ? 'bg-red-100 text-red-800' :
      'bg-yellow-100 text-yellow-800'
    }`}>
      Backend: {backendHealth}
    </div>
  )
}
```

## 💰 Cost Breakdown

### Free Tier Limits
**Vercel (Free)**:
- 100GB bandwidth/month
- 6,000 build minutes/month
- Unlimited static deployments
- Custom domains

**Railway (Free)**:
- $5 credit/month
- ~500 hours of usage
- 1GB RAM, 1 vCPU
- 1GB storage

### Paid Upgrades
**Vercel Pro ($20/month)**:
- 1TB bandwidth
- Unlimited build minutes
- Advanced analytics
- Team collaboration

**Railway Pro ($5/month)**:
- No sleep mode
- Better performance
- Priority support
- More resources

## 🚀 Going Live Checklist

- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Health endpoints working
- [ ] WebSocket connections successful
- [ ] MetaMask integration working
- [ ] Message sending/receiving tested
- [ ] Audio/video call buttons functional
- [ ] Mobile responsiveness verified
- [ ] Custom domain configured (optional)
- [ ] Analytics/monitoring setup
- [ ] Error tracking implemented

## 🔄 Future Updates

### Updating Your App
1. **Push changes to GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Automatic Deployments**
   - Vercel automatically redeploys on git push
   - Railway automatically redeploys on git push
   - No manual intervention needed!

### Rolling Back
1. **Vercel**: Go to deployments, click "Promote to Production" on previous version
2. **Railway**: Go to deployments, click "Redeploy" on previous version

## 🎯 Next Steps After Deployment

1. **Custom Domain** (Optional)
   - Add custom domain in Vercel
   - Update CORS_ORIGIN in Railway

2. **SSL Certificate**
   - Automatic with Vercel
   - Automatic with Railway

3. **Performance Monitoring**
   - Set up error tracking (Sentry)
   - Monitor user analytics
   - Track WebSocket connection success rates

4. **Scaling Preparation**
   - Monitor usage patterns
   - Plan for database upgrade when needed
   - Consider CDN for static assets

Your app will be live and accessible worldwide! 🌍