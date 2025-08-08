#!/bin/bash

# Fix Git Large Files Script for BlockRTC
# This script helps resolve "file too large" errors when pushing to GitHub

echo "🔧 Fixing Git Large Files Issue..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not in a Git repository. Please run this script from your project root."
    exit 1
fi

print_info "Starting cleanup process..."

# Step 1: Remove node_modules from tracking
print_info "Step 1: Removing node_modules from Git tracking..."
git rm -r --cached node_modules/ 2>/dev/null || true
git rm -r --cached server/node_modules/ 2>/dev/null || true
git rm -r --cached load-test/node_modules/ 2>/dev/null || true

# Step 2: Remove .next build folder
print_info "Step 2: Removing .next build folder..."
git rm -r --cached .next/ 2>/dev/null || true

# Step 3: Remove any large log files
print_info "Step 3: Removing log files..."
git rm -r --cached logs/ 2>/dev/null || true
git rm --cached *.log 2>/dev/null || true
git rm --cached server/*.log 2>/dev/null || true

# Step 4: Remove any database files
print_info "Step 4: Removing database files..."
git rm -r --cached server/data/ 2>/dev/null || true
git rm --cached *.db 2>/dev/null || true

# Step 5: Find and list large files
print_info "Step 5: Checking for large files in repository..."
echo "Files larger than 10MB:"
find . -type f -size +10M -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./server/node_modules/*" -not -path "./.next/*" | head -20

# Step 6: Check git status
print_info "Step 6: Current Git status:"
git status --porcelain

# Step 7: Clean up physical files
print_info "Step 7: Cleaning up physical files..."
rm -rf node_modules/ 2>/dev/null || true
rm -rf server/node_modules/ 2>/dev/null || true
rm -rf load-test/node_modules/ 2>/dev/null || true
rm -rf .next/ 2>/dev/null || true
rm -rf logs/ 2>/dev/null || true
rm -f *.log 2>/dev/null || true
rm -f server/*.log 2>/dev/null || true

# Step 8: Add .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_warn ".gitignore not found. Creating one..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
server/node_modules/
load-test/node_modules/

# Production builds
.next/
out/
build/
dist/

# Environment variables
.env*
server/.env*

# Logs
logs/
*.log

# Database
server/data/
*.db

# OS files
.DS_Store
Thumbs.db
EOF
fi

# Step 9: Stage the .gitignore
print_info "Step 8: Adding .gitignore to Git..."
git add .gitignore

# Step 10: Commit the cleanup
print_info "Step 9: Committing cleanup changes..."
git add -A
git commit -m "🧹 Clean up large files and add proper .gitignore

- Remove node_modules from tracking
- Remove .next build folder
- Remove log files and database files
- Add comprehensive .gitignore
- Prepare for deployment"

print_info "✅ Cleanup completed!"

# Step 11: Check repository size
print_info "Step 10: Checking repository size..."
du -sh .git/
echo ""

# Step 12: Provide next steps
print_info "🚀 Next Steps:"
echo "1. Install dependencies: npm install"
echo "2. Install server dependencies: cd server && npm install && cd .."
echo "3. Test locally: npm run dev (in one terminal) and cd server && npm run dev (in another)"
echo "4. Push to GitHub: git push origin main"
echo ""

print_warn "If you still get 'file too large' errors:"
echo "1. Check for any remaining large files: find . -type f -size +50M"
echo "2. Use Git LFS for large files: git lfs track '*.large-extension'"
echo "3. Or remove large files completely"
echo ""

print_info "Repository is now ready for GitHub and deployment! 🎉"