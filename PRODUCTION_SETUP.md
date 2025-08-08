# BlockRTC Production Deployment Guide

This guide covers deploying the BlockRTC (WhatsApp-like chat with MetaMask) application to production.

## 🏗️ Architecture Overview

- **Frontend**: Next.js application (React + TypeScript)
- **Backend**: Node.js + Express + Socket.io server
- **Database**: File-based storage (can be upgraded to MongoDB/PostgreSQL)
- **Authentication**: MetaMask wallet integration
- **Real-time**: WebRTC P2P + Socket.io fallback

## 📋 Prerequisites

- Node.js 18+ installed
- Domain name with SSL certificate
- Cloud hosting provider (AWS, DigitalOcean, Vercel, etc.)
- MetaMask browser extension for testing

## 🚀 Deployment Options

### Option 1: Vercel + Railway (Recommended for beginners)

#### Frontend (Vercel)
1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `.next`
   - Add environment variables (see below)

#### Backend (Railway)
1. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub
   - Select the `server` folder
   - Set start command: `npm start`
   - Add environment variables

### Option 2: DigitalOcean Droplet (Full control)

#### Server Setup
```bash
# Create and connect to droplet
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
apt install nginx -y

# Install SSL certificate (Let's Encrypt)
apt install certbot python3-certbot-nginx -y
```

#### Application Deployment
```bash
# Clone repository
git clone https://github.com/yourusername/blockrtc.git
cd blockrtc

# Install frontend dependencies
npm install
npm run build

# Install backend dependencies
cd server
npm install
cd ..

# Create PM2 ecosystem file (see below)
# Start applications with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: AWS (Enterprise-grade)

#### Using AWS Amplify + EC2
1. **Frontend**: Deploy to AWS Amplify
2. **Backend**: Deploy to EC2 with Load Balancer
3. **Database**: Use RDS or DynamoDB
4. **Storage**: Use S3 for file uploads

## 🔧 Configuration Files

### 1. Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
```

#### Backend (.env)
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com
```

### 2. PM2 Ecosystem Configuration

Create `ecosystem.config.js` in project root:
```javascript
module.exports = {
  apps: [
    {
      name: 'blockrtc-frontend',
      script: 'npm',
      args: 'start',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'blockrtc-backend',
      script: 'server.js',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
}
```

### 3. Nginx Configuration

Create `/etc/nginx/sites-available/blockrtc`:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/blockrtc /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 4. SSL Certificate Setup
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔄 Production Updates

### Update Script (update.sh)
```bash
#!/bin/bash
echo "🚀 Updating BlockRTC..."

# Pull latest changes
git pull origin main

# Update frontend
echo "📦 Installing frontend dependencies..."
npm install
npm run build

# Update backend
echo "🔧 Installing backend dependencies..."
cd server
npm install
cd ..

# Restart applications
echo "🔄 Restarting applications..."
pm2 restart ecosystem.config.js

echo "✅ Update complete!"
```

Make it executable:
```bash
chmod +x update.sh
```

## 📊 Monitoring & Logging

### 1. PM2 Monitoring
```bash
# View logs
pm2 logs

# Monitor processes
pm2 monit

# View status
pm2 status
```

### 2. Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### 3. Application Logs
Add logging to your application:

```javascript
// server/server.js - Add at the top
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});
```

## 🔒 Security Considerations

### 1. Server Security
```bash
# Configure firewall
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable

# Disable root login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart ssh
```

### 2. Application Security
- Enable CORS properly
- Add rate limiting
- Validate all inputs
- Use HTTPS everywhere
- Implement CSP headers

### 3. Environment Variables
Never commit sensitive data. Use:
- `.env` files (gitignored)
- Cloud provider secrets
- Environment variable injection

## 🗄️ Database Migration (Optional)

### Upgrade to MongoDB
```bash
# Install MongoDB
apt install mongodb -y

# Install mongoose
cd server
npm install mongoose
```

Update server code:
```javascript
// server/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
```

## 📱 Mobile Considerations

### PWA Setup
Add to `pages/_app.tsx`:
```javascript
import Head from 'next/head'

// Add PWA meta tags
<Head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#3B82F6" />
  <link rel="manifest" href="/manifest.json" />
  <link rel="apple-touch-icon" href="/icon-192x192.png" />
</Head>
```

Create `public/manifest.json`:
```json
{
  "name": "BlockRTC",
  "short_name": "BlockRTC",
  "description": "Decentralized chat with MetaMask",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 🧪 Testing in Production

### 1. Health Check Endpoints
Add to server:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### 2. Load Testing
```bash
# Install artillery
npm install -g artillery

# Create load test
artillery quick --count 10 --num 5 https://yourdomain.com
```

## 🚨 Troubleshooting

### Common Issues

1. **Socket.io Connection Failed**
   - Check CORS settings
   - Verify SSL certificate
   - Check firewall rules

2. **MetaMask Not Connecting**
   - Ensure HTTPS is enabled
   - Check browser console for errors
   - Verify domain is whitelisted

3. **WebRTC Not Working**
   - Check STUN/TURN server configuration
   - Verify firewall allows WebRTC ports
   - Test with different browsers

### Debug Commands
```bash
# Check if services are running
pm2 status

# Check nginx configuration
nginx -t

# Check SSL certificate
certbot certificates

# Check open ports
netstat -tlnp
```

## 📈 Performance Optimization

### 1. Frontend Optimization
- Enable Next.js image optimization
- Use CDN for static assets
- Implement code splitting
- Add service worker for caching

### 2. Backend Optimization
- Implement Redis for session storage
- Add database indexing
- Use connection pooling
- Implement caching strategies

### 3. Infrastructure
- Use CDN (CloudFlare, AWS CloudFront)
- Implement load balancing
- Add auto-scaling
- Monitor with tools like New Relic

## 🎯 Go-Live Checklist

- [ ] Domain configured with SSL
- [ ] Environment variables set
- [ ] Database backup strategy
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Backup and recovery tested
- [ ] Load testing completed
- [ ] Mobile responsiveness verified
- [ ] MetaMask integration tested
- [ ] WebRTC functionality verified

## 📞 Support

For production issues:
1. Check application logs
2. Monitor server resources
3. Verify network connectivity
4. Test MetaMask integration
5. Check WebRTC connectivity

Remember to test thoroughly in a staging environment before deploying to production!