# 🚀 BlockRTC Deployment Checklist

Follow this step-by-step checklist to deploy your app to Vercel + Railway.

## ✅ Pre-Deployment Steps

### 1. Code Preparation
- [ ] All code committed to GitHub
- [ ] `next.config.js` updated for production
- [ ] Server CORS configuration updated
- [ ] Environment example files created

```bash
# Commit your changes
git add .
git commit -m "Ready for production deployment"
git push origin main
```

## 🚂 Railway Backend Deployment

### 2. Create Railway Account
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up with GitHub
- [ ] Verify your email

### 3. Deploy Backend Service
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your BlockRTC repository
- [ ] **Important**: Set root directory to `server`

### 4. Configure Railway Environment Variables
Add these variables in Railway dashboard:
```
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-app-name.vercel.app
```
**Note**: You'll update CORS_ORIGIN after Vercel deployment

### 5. Test Railway Deployment
- [ ] Wait for deployment to complete
- [ ] Copy your Railway URL (e.g., `https://your-app.up.railway.app`)
- [ ] Test health endpoint:
```bash
curl https://your-railway-url.up.railway.app/health
```

## ▲ Vercel Frontend Deployment

### 6. Create Vercel Account
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with GitHub
- [ ] Connect GitHub account

### 7. Import Project to Vercel
- [ ] Click "New Project"
- [ ] Import your BlockRTC repository
- [ ] Verify settings:
  - Framework: Next.js (auto-detected)
  - Build Command: `npm run build`
  - Output Directory: `.next`

### 8. Configure Vercel Environment Variables
Add these in Vercel dashboard:
```
NEXT_PUBLIC_SOCKET_URL=https://your-railway-url.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production
```

### 9. Deploy Frontend
- [ ] Click "Deploy"
- [ ] Wait for build to complete
- [ ] Copy your Vercel URL

## 🔄 Final Configuration

### 10. Update Railway CORS
- [ ] Go back to Railway dashboard
- [ ] Update `CORS_ORIGIN` with your actual Vercel URL
- [ ] Redeploy Railway service

### 11. Test Complete Deployment
- [ ] Open your Vercel app URL
- [ ] Connect MetaMask wallet
- [ ] Add a test contact
- [ ] Send a test message
- [ ] Check browser console for errors

## 🧪 Testing Checklist

### Frontend Tests
- [ ] App loads without errors
- [ ] MetaMask connection works
- [ ] Wallet address displays correctly
- [ ] Contact list loads
- [ ] Add contact functionality works

### Backend Tests
- [ ] Health endpoint responds
- [ ] WebSocket connection establishes
- [ ] Messages send successfully
- [ ] Messages receive successfully
- [ ] No CORS errors in console

### Integration Tests
- [ ] Real-time messaging works
- [ ] Contact status updates
- [ ] Audio call buttons appear
- [ ] Video call buttons appear
- [ ] Sign out functionality works

## 🐛 Troubleshooting

### Common Issues & Solutions

#### CORS Errors
**Problem**: "CORS policy" errors in browser console
**Solution**:
1. Verify CORS_ORIGIN in Railway matches Vercel URL exactly
2. Redeploy Railway service
3. Clear browser cache

#### WebSocket Connection Failed
**Problem**: "WebSocket connection failed"
**Solution**:
1. Check Railway service is running
2. Verify NEXT_PUBLIC_SOCKET_URL in Vercel
3. Check Railway logs for errors

#### Build Failures
**Problem**: Vercel build fails
**Solution**:
1. Check build logs in Vercel dashboard
2. Verify all dependencies in package.json
3. Check for TypeScript errors

#### Railway Service Sleeping
**Problem**: First request takes 30+ seconds
**Solution**:
1. Upgrade to Railway Pro ($5/month)
2. Or add keep-alive ping (see deployment guide)

## 📊 Post-Deployment Monitoring

### 12. Set Up Monitoring
- [ ] Check Vercel Analytics
- [ ] Monitor Railway logs
- [ ] Set up error tracking (optional)
- [ ] Monitor WebSocket connections

### 13. Performance Verification
- [ ] Page load speed < 3 seconds
- [ ] WebSocket connects < 2 seconds
- [ ] Messages send/receive < 1 second
- [ ] No memory leaks in browser

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Frontend loads on Vercel URL
- ✅ Backend responds on Railway URL
- ✅ MetaMask connects successfully
- ✅ Messages send and receive
- ✅ No console errors
- ✅ Mobile responsive design works

## 📝 URLs to Save

After deployment, save these URLs:

```
Frontend (Vercel): https://your-app-name.vercel.app
Backend (Railway): https://your-app.up.railway.app
Health Check: https://your-app.up.railway.app/health
```

## 🔄 Future Updates

### Automatic Deployments
- ✅ Push to GitHub → Automatic deployment
- ✅ No manual intervention needed
- ✅ Rollback available in dashboards

### Scaling Considerations
When you reach these limits, consider upgrading:
- **1,000+ concurrent users**: Upgrade Railway plan
- **10,000+ users**: Add Redis and database
- **100,000+ users**: Implement full scaling architecture

## 🎉 Congratulations!

Once all checkboxes are complete, your BlockRTC app is live and ready for users worldwide! 🌍

Share your app URL and start testing with friends using different MetaMask wallets.