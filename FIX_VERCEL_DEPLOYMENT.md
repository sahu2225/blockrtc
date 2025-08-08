# 🔧 Fix Vercel Deployment Permission Error

## 🚨 Problem: Permission Denied Error

Vercel is failing with:
```
sh: line 1: /vercel/path0/node_modules/.bin/next: Permission denied
Error: Command "npm run build" exited with 126
```

This is a permission issue with the Next.js binary.

## ✅ Solutions (Try in Order)

### Solution 1: Update package.json Scripts

Update your `package.json` build script to be more explicit:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build && next export",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Solution 2: Add Vercel Configuration

Create `vercel.json` in your project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_SOCKET_URL": "https://blockrtc-backend-production.up.railway.app",
    "NEXT_PUBLIC_ENVIRONMENT": "production"
  }
}
```

### Solution 3: Force Vercel to Use Specific Node Version

Add to your `package.json`:

```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### Solution 4: Override Build Command in Vercel

In Vercel dashboard:
1. **Go to your project settings**
2. **Build & Development Settings**
3. **Override Build Command:** `npx next build`
4. **Override Install Command:** `npm ci`

## 🚀 Quick Fix Steps

### Step 1: Update Your Repository

Add these files to your main repository:

#### Create `vercel.json`:
```json
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npx next build",
  "env": {
    "NEXT_PUBLIC_SOCKET_URL": "https://blockrtc-backend-production.up.railway.app",
    "NEXT_PUBLIC_ENVIRONMENT": "production"
  }
}
```

#### Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "npx next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Step 2: Push Changes

```bash
git add vercel.json package.json
git commit -m "Fix Vercel deployment configuration"
git push origin main
```

### Step 3: Redeploy on Vercel

1. **Go to Vercel dashboard**
2. **Go to your project**
3. **Click "Redeploy"**
4. **Or trigger new deployment by pushing to GitHub**

## 🔧 Alternative: Manual Vercel Settings

If the above doesn't work, manually configure in Vercel:

### Build Settings:
- **Framework Preset:** Next.js
- **Build Command:** `npx next build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`
- **Development Command:** `npm run dev`

### Environment Variables:
```
NEXT_PUBLIC_SOCKET_URL=https://blockrtc-backend-production.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production
```

## 🐛 Common Causes & Solutions

### Cause 1: Node Modules Permission Issue
**Solution:** Use `npx` instead of direct binary calls

### Cause 2: Vercel Cache Issue
**Solution:** Clear build cache in Vercel settings

### Cause 3: Package.json Issues
**Solution:** Ensure all dependencies are in `dependencies`, not `devDependencies`

### Cause 4: Next.js Version Compatibility
**Solution:** Update to latest stable Next.js version

## 🧪 Test Build Locally

Before redeploying, test locally:

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Test build
npm run build

# Should complete without errors
```

## ✅ Success Indicators

When Vercel deployment works:
- ✅ Build completes without permission errors
- ✅ Next.js build succeeds
- ✅ Static files generated
- ✅ Deployment URL accessible
- ✅ Environment variables loaded

## 🚨 Nuclear Option: Fresh Vercel Project

If nothing works:

1. **Delete current Vercel project**
2. **Create new Vercel project**
3. **Import repository again**
4. **Use manual build settings**
5. **Add environment variables**

## 📝 Updated Files Needed

Make sure you have these files in your repository:

```
blockrtc/
├── vercel.json          (Vercel configuration)
├── package.json         (Updated scripts)
├── next.config.js       (Already updated)
└── .env.example         (Environment template)
```

## 🎯 Expected Result

After fixing:
- ✅ Vercel build succeeds
- ✅ Frontend deploys successfully
- ✅ App loads on Vercel URL
- ✅ Can connect to Railway backend

The permission error is fixable - it's just a configuration issue! 🚀