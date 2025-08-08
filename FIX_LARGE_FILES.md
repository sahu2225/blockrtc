# 🔧 Fix "File Too Large" Git Error

GitHub has a 100MB file size limit. This error usually happens when `node_modules` or build files get tracked by Git.

## 🚀 Quick Fix (Choose your OS)

### For Windows:
```bash
# Run the cleanup script
./fix-git-large-files.bat
```

### For Mac/Linux:
```bash
# Make script executable
chmod +x fix-git-large-files.sh

# Run the cleanup script
./fix-git-large-files.sh
```

### Manual Fix (if scripts don't work):

1. **Remove large folders from Git tracking:**
```bash
git rm -r --cached node_modules/
git rm -r --cached server/node_modules/
git rm -r --cached .next/
git rm -r --cached logs/
```

2. **Delete physical files:**
```bash
# Windows
rmdir /s /q node_modules
rmdir /s /q server\node_modules
rmdir /s /q .next

# Mac/Linux
rm -rf node_modules/
rm -rf server/node_modules/
rm -rf .next/
```

3. **Add .gitignore (already created for you)**

4. **Commit the cleanup:**
```bash
git add .gitignore
git add -A
git commit -m "Clean up large files and add .gitignore"
```

5. **Push to GitHub:**
```bash
git push origin main
```

## 🔍 Find Large Files

If you still have issues, find large files:

```bash
# Find files larger than 50MB
find . -type f -size +50M -not -path "./.git/*"

# On Windows (PowerShell)
Get-ChildItem -Recurse | Where-Object {$_.Length -gt 50MB} | Select-Object Name, Length, FullName
```

## 🧹 What the cleanup removes:

- ✅ `node_modules/` folders (can be reinstalled)
- ✅ `.next/` build folder (regenerated on build)
- ✅ Log files (`*.log`)
- ✅ Database files (`server/data/`)
- ✅ Temporary files

## ⚠️ What's preserved:

- ✅ All your source code
- ✅ Configuration files
- ✅ `package.json` files
- ✅ Environment examples

## 🚀 After cleanup:

1. **Reinstall dependencies:**
```bash
npm install
cd server && npm install && cd ..
```

2. **Test locally:**
```bash
# Terminal 1
npm run dev

# Terminal 2
cd server && npm run dev
```

3. **Push to GitHub:**
```bash
git push origin main
```

4. **Deploy to Vercel + Railway** (follow deployment guide)

## 🆘 Still having issues?

### Option 1: Use Git LFS for large files
```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.zip"
git lfs track "*.tar.gz"

# Add and commit
git add .gitattributes
git commit -m "Add Git LFS tracking"
```

### Option 2: Start fresh repository
```bash
# Create new repo without history
git checkout --orphan main-clean
git add -A
git commit -m "Clean start for deployment"
git branch -D main
git branch -m main
git push -f origin main
```

## ✅ Success indicators:

- No "file too large" errors
- `git status` shows clean working directory
- Repository size under 1GB
- All source code preserved
- Dependencies can be reinstalled

Your repository is now ready for GitHub and deployment! 🎉