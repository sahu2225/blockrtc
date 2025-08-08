#!/bin/bash

# BlockRTC Production Deployment Script
set -e

echo "🚀 Starting BlockRTC deployment..."

# Configuration
DOMAIN=${1:-"yourdomain.com"}
ENVIRONMENT=${2:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        log_warn "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    fi
    
    log_info "Prerequisites check completed ✅"
}

# Create necessary directories
create_directories() {
    log_info "Creating necessary directories..."
    mkdir -p logs
    mkdir -p server/data
    mkdir -p ssl
    log_info "Directories created ✅"
}

# Install dependencies
install_dependencies() {
    log_info "Installing frontend dependencies..."
    npm install
    
    log_info "Installing backend dependencies..."
    cd server
    npm install
    cd ..
    
    log_info "Dependencies installed ✅"
}

# Build application
build_application() {
    log_info "Building Next.js application..."
    npm run build
    log_info "Application built ✅"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Frontend environment
    if [ ! -f .env.local ]; then
        cat > .env.local << EOF
NEXT_PUBLIC_SOCKET_URL=https://api.${DOMAIN}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NEXT_PUBLIC_ENVIRONMENT=${ENVIRONMENT}
EOF
        log_info "Frontend environment file created"
    else
        log_warn "Frontend environment file already exists"
    fi
    
    # Backend environment
    if [ ! -f server/.env ]; then
        cat > server/.env << EOF
NODE_ENV=${ENVIRONMENT}
PORT=3001
CORS_ORIGIN=https://${DOMAIN}
EOF
        log_info "Backend environment file created"
    else
        log_warn "Backend environment file already exists"
    fi
    
    log_info "Environment setup completed ✅"
}

# Setup PM2
setup_pm2() {
    log_info "Setting up PM2..."
    
    # Stop existing processes
    pm2 delete all 2>/dev/null || true
    
    # Start applications
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup
    pm2 startup
    
    log_info "PM2 setup completed ✅"
}

# Setup Nginx (if available)
setup_nginx() {
    if command -v nginx &> /dev/null; then
        log_info "Setting up Nginx configuration..."
        
        # Backup existing configuration
        if [ -f /etc/nginx/sites-available/default ]; then
            sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
        fi
        
        # Create Nginx configuration
        sudo tee /etc/nginx/sites-available/blockrtc > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL configuration (update paths as needed)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
        
        # Enable site
        sudo ln -sf /etc/nginx/sites-available/blockrtc /etc/nginx/sites-enabled/
        
        # Test configuration
        sudo nginx -t
        
        # Reload Nginx
        sudo systemctl reload nginx
        
        log_info "Nginx setup completed ✅"
    else
        log_warn "Nginx not found. Skipping Nginx configuration."
    fi
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Wait for applications to start
    sleep 10
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "Frontend is running ✅"
    else
        log_error "Frontend health check failed ❌"
        return 1
    fi
    
    # Check backend
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "Backend is running ✅"
    else
        log_error "Backend health check failed ❌"
        return 1
    fi
    
    log_info "Health check completed ✅"
}

# Main deployment process
main() {
    log_info "Starting deployment for domain: ${DOMAIN}"
    log_info "Environment: ${ENVIRONMENT}"
    
    check_prerequisites
    create_directories
    install_dependencies
    build_application
    setup_environment
    setup_pm2
    setup_nginx
    health_check
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Your application should be running at:"
    log_info "  Frontend: http://localhost:3000"
    log_info "  Backend:  http://localhost:3001"
    
    if command -v nginx &> /dev/null; then
        log_info "  Domain:   https://${DOMAIN} (after SSL setup)"
    fi
    
    log_info ""
    log_info "Next steps:"
    log_info "1. Set up SSL certificate with: sudo certbot --nginx -d ${DOMAIN}"
    log_info "2. Test your application thoroughly"
    log_info "3. Monitor logs with: pm2 logs"
    log_info "4. Check status with: pm2 status"
}

# Run main function
main "$@"