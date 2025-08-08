# 🐙 Setup GitHub Repository for BlockRTC

## 🔍 Fix "Repository not found" Error

This error happens when:
1. The GitHub repository doesn't exist
2. Wrong repository URL
3. Authentication issues
4. Repository is private and you don't have access

## 🚀 Solution: Create New GitHub Repository

### Step 1: Create Repository on GitHub

1. **Go to GitHub.com**
2. **Sign in to your account**
3. **Click the "+" icon** in top right corner
4. **Select "New repository"**
5. **Fill in details:**
   - Repository name: `blockrtc` (or `BlockRTC`)
   - Description: `Decentralized chat app with MetaMask authentication`
   - Visibility: **Public** (recommended for deployment)
   - ❌ **Don't** initialize with README (you already have files)
   - ❌ **Don't** add .gitignore (you already have one)
   - ❌ **Don't** add license (optional)
6. **Click "Create repository"**

### Step 2: Connect Your Local Repository

After creating the repository, GitHub will show you commands. Use these:

```bash
# Check current remote (if any)
git remote -v

# Remove old remote if it exists
git remote remove origin

# Add your new repository as remote
git remote add origin https://github.com/YOUR_USERNAME/blockrtc.git

# Verify the remote is added correctly
git remote -v
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### Step 3: Push Your Code

```bash
# Make sure you're on the main branch
git branch -M main

# Push your code to GitHub
git push -u origin main
```

## 🔧 Alternative: Fix Existing Remote

If you want to keep the same repository name, check these:

### Check Current Remote:
```bash
git remote -v
```

### Update Remote URL:
```bash
# If repository exists but URL is wrong
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Then try pushing
git push -u origin main
```

## 🆘 Troubleshooting

### Issue 1: Authentication Failed
**Solution**: Use Personal Access Token instead of password

1. **Generate token**: GitHub Settings → Developer settings → Personal access tokens → Generate new token
2. **Use token as password** when prompted
3. **Or use SSH**: 
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/blockrtc.git
   ```

### Issue 2: Repository Name Mismatch
**Check if repository exists**: Go to `https://github.com/YOUR_USERNAME/blockrtc`

If it doesn't exist, create it following Step 1 above.

### Issue 3: Branch Name Issues
```bash
# Check current branch
git branch

# Rename to main if needed
git branch -M main

# Push to main
git push -u origin main
```

## ✅ Verification Steps

After setting up the repository:

1. **Check remote connection:**
   ```bash
   git remote -v
   # Should show: origin https://github.com/YOUR_USERNAME/blockrtc.git
   ```

2. **Test push:**
   ```bash
   git push origin main
   # Should upload your files successfully
   ```

3. **Verify on GitHub:**
   - Go to your repository URL
   - You should see all your files
   - README.md should be visible

## 🚀 Ready for Deployment

Once your repository is set up and pushed:

1. ✅ **Repository exists on GitHub**
2. ✅ **All files are uploaded**
3. ✅ **Repository is public** (for easy deployment)

Now you can proceed with:
- **Vercel deployment** (import from GitHub)
- **Railway deployment** (import from GitHub)

## 📝 Quick Commands Summary

```bash
# Create and setup new repository
git remote remove origin  # Remove old remote
git remote add origin https://github.com/YOUR_USERNAME/blockrtc.git
git branch -M main
git push -u origin main

# Verify everything worked
git remote -v
git status
```

## 🎯 Next Steps

After your repository is successfully pushed to GitHub:

1. **Continue with Vercel deployment**
2. **Continue with Railway deployment**
3. **Follow the deployment checklist**

Your GitHub repository is the foundation for both Vercel and Railway deployments! 🌟