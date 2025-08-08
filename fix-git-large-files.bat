@echo off
REM Fix Git Large Files Script for BlockRTC (Windows)
REM This script helps resolve "file too large" errors when pushing to GitHub

echo 🔧 Fixing Git Large Files Issue...

REM Check if we're in a git repository
if not exist ".git" (
    echo [ERROR] Not in a Git repository. Please run this script from your project root.
    pause
    exit /b 1
)

echo [INFO] Starting cleanup process...

REM Step 1: Remove node_modules from tracking
echo [INFO] Step 1: Removing node_modules from Git tracking...
git rm -r --cached node_modules/ 2>nul
git rm -r --cached server/node_modules/ 2>nul
git rm -r --cached load-test/node_modules/ 2>nul

REM Step 2: Remove .next build folder
echo [INFO] Step 2: Removing .next build folder...
git rm -r --cached .next/ 2>nul

REM Step 3: Remove any large log files
echo [INFO] Step 3: Removing log files...
git rm -r --cached logs/ 2>nul
git rm --cached *.log 2>nul
git rm --cached server/*.log 2>nul

REM Step 4: Remove any database files
echo [INFO] Step 4: Removing database files...
git rm -r --cached server/data/ 2>nul
git rm --cached *.db 2>nul

REM Step 5: Check git status
echo [INFO] Step 5: Current Git status:
git status --porcelain

REM Step 6: Clean up physical files
echo [INFO] Step 6: Cleaning up physical files...
if exist "node_modules" rmdir /s /q node_modules 2>nul
if exist "server\node_modules" rmdir /s /q server\node_modules 2>nul
if exist "load-test\node_modules" rmdir /s /q load-test\node_modules 2>nul
if exist ".next" rmdir /s /q .next 2>nul
if exist "logs" rmdir /s /q logs 2>nul
del *.log 2>nul
del server\*.log 2>nul

REM Step 7: Add .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo [WARN] .gitignore not found. Creating one...
    (
        echo # Dependencies
        echo node_modules/
        echo server/node_modules/
        echo load-test/node_modules/
        echo.
        echo # Production builds
        echo .next/
        echo out/
        echo build/
        echo dist/
        echo.
        echo # Environment variables
        echo .env*
        echo server/.env*
        echo.
        echo # Logs
        echo logs/
        echo *.log
        echo.
        echo # Database
        echo server/data/
        echo *.db
        echo.
        echo # OS files
        echo .DS_Store
        echo Thumbs.db
    ) > .gitignore
)

REM Step 8: Stage the .gitignore
echo [INFO] Step 7: Adding .gitignore to Git...
git add .gitignore

REM Step 9: Commit the cleanup
echo [INFO] Step 8: Committing cleanup changes...
git add -A
git commit -m "🧹 Clean up large files and add proper .gitignore - Remove node_modules from tracking - Remove .next build folder - Remove log files and database files - Add comprehensive .gitignore - Prepare for deployment"

echo [INFO] ✅ Cleanup completed!

REM Step 10: Provide next steps
echo [INFO] 🚀 Next Steps:
echo 1. Install dependencies: npm install
echo 2. Install server dependencies: cd server ^&^& npm install ^&^& cd ..
echo 3. Test locally: npm run dev (in one terminal) and cd server ^&^& npm run dev (in another)
echo 4. Push to GitHub: git push origin main
echo.

echo [WARN] If you still get 'file too large' errors:
echo 1. Check for any remaining large files manually
echo 2. Use Git LFS for large files: git lfs track '*.large-extension'
echo 3. Or remove large files completely
echo.

echo [INFO] Repository is now ready for GitHub and deployment! 🎉

pause