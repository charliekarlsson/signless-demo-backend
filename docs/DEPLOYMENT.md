# Deployment Guide

Complete guide for deploying the Solana Transaction Authentication system to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Deployment Platforms](#deployment-platforms)
4. [Post-Deployment](#post-deployment)
5. [Monitoring](#monitoring)

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Test thoroughly on Solana Devnet
- [ ] Set up production Solana wallet
- [ ] Choose RPC provider (Alchemy, QuickNode, etc.)
- [ ] Configure environment variables
- [ ] Set up SSL/TLS certificates
- [ ] Implement rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure CORS properly
- [ ] Set up logging
- [ ] Database/Redis for session storage (recommended)
- [ ] Backup and disaster recovery plan

## Environment Setup

### Production Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000

# Solana (MAINNET)
SOLANA_RPC_URL=https://your-mainnet-rpc-url.com
RECEIVER_WALLET_ADDRESS=YourProductionWalletAddress

# Authentication
VERIFICATION_AMOUNT=0.00001
SESSION_EXPIRY_MINUTES=15

# Security
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional: Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://user:pass@host:6379

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### Recommended RPC Providers

**1. Alchemy**
- URL: https://www.alchemy.com/
- Pros: Reliable, good free tier, excellent docs
- Price: Free tier available

**2. QuickNode**
- URL: https://www.quicknode.com/
- Pros: Fast, dedicated nodes, good support
- Price: Starts at $9/month

**3. Helius**
- URL: https://www.helius.dev/
- Pros: Solana-focused, enhanced APIs
- Price: Free tier available

**4. GenesysGo**
- URL: https://genesysgo.com/
- Pros: Community-driven, reliable
- Price: Various tiers

## Deployment Platforms

### 1. Railway (Recommended for Quick Deploy)

**Steps:**

1. **Create Account**: Sign up at [railway.app](https://railway.app)

2. **New Project**: Click "New Project" → "Deploy from GitHub repo"

3. **Configure**:
   - Select your repository
   - Railway auto-detects Node.js
   - Add environment variables in Settings

4. **Deploy**:
   - Automatic deployment on git push
   - Get your deployment URL

**Railway Configuration**:

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Cost**: ~$5-10/month

### 2. Heroku

**Steps:**

```powershell
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SOLANA_RPC_URL=your-rpc-url
heroku config:set RECEIVER_WALLET_ADDRESS=your-wallet

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

**Procfile** (create in root):
```
web: npm start
```

**Cost**: ~$7/month (Eco Dynos)

### 3. DigitalOcean App Platform

**Steps:**

1. **Create Account**: [digitalocean.com](https://www.digitalocean.com/)

2. **New App**:
   - Apps → Create App
   - Connect GitHub repository

3. **Configure**:
   - Detect Node.js automatically
   - Set environment variables
   - Choose $5/month tier

4. **Deploy**: Automatic deployment

**Cost**: Starts at $5/month

### 4. AWS (EC2 + Docker)

**For Advanced Users**

**Steps:**

1. **Launch EC2 Instance**:
   - t2.micro (free tier eligible)
   - Ubuntu 22.04 LTS

2. **Install Dependencies**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt install git -y
```

3. **Clone and Setup**:
```bash
git clone your-repo-url
cd signless
npm install
```

4. **Use PM2 for Process Management**:
```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start src/server.js --name solana-auth

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

5. **Setup Nginx Reverse Proxy**:
```bash
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/solana-auth
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/solana-auth /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

**Cost**: ~$5-10/month

### 5. Docker Deployment

**Dockerfile** (already in project):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Docker Compose** (create `docker-compose.yml`):
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SOLANA_RPC_URL=${SOLANA_RPC_URL}
      - RECEIVER_WALLET_ADDRESS=${RECEIVER_WALLET_ADDRESS}
    restart: unless-stopped
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

**Deploy**:
```powershell
# Build
docker-compose build

# Run
docker-compose up -d

# View logs
docker-compose logs -f
```

### 6. Frontend Deployment

#### Vercel (Recommended for Frontend)

```powershell
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Netlify

1. Connect GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy

#### Same Server (Traditional)

```bash
# Build frontend
cd frontend
npm run build

# Serve with nginx or serve static files from Express
```

## Post-Deployment

### 1. Verify Deployment

Test all endpoints:

```bash
# Health check
curl https://your-api-url.com/health

# Test auth initiation
curl -X POST https://your-api-url.com/api/auth/initiate \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"YourTestWallet"}'
```

### 2. Setup Monitoring

**Error Tracking with Sentry**:

```bash
npm install @sentry/node
```

```javascript
// Add to server.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Uptime Monitoring**:
- [UptimeRobot](https://uptimerobot.com/) - Free
- [Pingdom](https://www.pingdom.com/)
- [Better Uptime](https://betteruptime.com/)

### 3. Setup Logging

```bash
npm install winston
```

```javascript
// logging.js
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}

export default logger;
```

### 4. Database for Sessions (Optional but Recommended)

**Using PostgreSQL**:

```javascript
// Example with pg
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Store session
export const saveSession = async (sessionId, data) => {
  await pool.query(
    'INSERT INTO sessions (id, data, created_at) VALUES ($1, $2, NOW())',
    [sessionId, JSON.stringify(data)]
  );
};
```

**Using Redis**:

```javascript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const saveSession = async (sessionId, data) => {
  await redis.setex(sessionId, 900, JSON.stringify(data)); // 15 min expiry
};
```

## Monitoring

### Key Metrics to Track

1. **API Response Times**
2. **Error Rates**
3. **Authentication Success/Failure Rates**
4. **Active Sessions**
5. **RPC Performance**
6. **Server CPU/Memory Usage**

### Setting Up Dashboards

**Simple Dashboard with Express**:

```javascript
// Add to routes
app.get('/api/stats', (req, res) => {
  res.json({
    uptime: process.uptime(),
    timestamp: Date.now(),
    pendingAuths: getPendingAuths().length,
    // Add more metrics
  });
});
```

### Alerts

Set up alerts for:
- Server downtime
- High error rates
- Failed authentications
- RPC connection issues

## Scaling

### Horizontal Scaling

For high traffic:

1. **Load Balancer**: Use nginx or cloud load balancer
2. **Multiple Instances**: Deploy multiple API instances
3. **Shared Session Store**: Use Redis for shared sessions
4. **CDN**: Use CloudFlare for frontend

### Optimization Tips

1. **Connection Pooling**: Reuse Solana connections
2. **Caching**: Cache transaction verifications
3. **Rate Limiting**: Prevent abuse
4. **Async Processing**: Use queues for heavy operations

## Backup and Recovery

### Database Backups

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Disaster Recovery Plan

1. Keep environment variables backed up securely
2. Document all infrastructure setup
3. Test recovery procedures
4. Have rollback plan ready

## Cost Estimates

| Platform | Monthly Cost | Pros |
|----------|-------------|------|
| Railway | $5-10 | Easy, auto-deploy |
| Heroku | $7+ | Reliable, popular |
| DigitalOcean | $5+ | Full control |
| AWS EC2 | $5-15 | Scalable |
| Vercel (Frontend) | Free-$20 | Fast, global CDN |

**RPC Costs**:
- Free tier: Usually sufficient for small/medium apps
- Paid: $0-50/month depending on usage

**Total Estimated Monthly Cost**: $10-30 for small to medium applications

## Security Checklist

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Rate limiting implemented
- [ ] CORS configured properly
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Regular security updates
- [ ] Monitoring and alerts active
- [ ] Backup strategy in place
- [ ] Access logs enabled

## Troubleshooting

**Common Issues**:

1. **RPC Connection Errors**: Check RPC URL and API limits
2. **CORS Errors**: Verify CORS_ORIGINS setting
3. **Transaction Not Found**: Wait for confirmation, check network
4. **Session Expiry**: Check SESSION_EXPIRY_MINUTES setting
5. **High Memory Usage**: Implement session cleanup

## Next Steps

After deployment:

1. Monitor for 24-48 hours
2. Test with real users
3. Collect feedback
4. Optimize based on usage patterns
5. Set up automated backups
6. Document API for users
7. Create status page

## Support Resources

- [Solana Docs](https://docs.solana.com/)
- [Railway Docs](https://docs.railway.app/)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

Need help? Open an issue or contact support!
