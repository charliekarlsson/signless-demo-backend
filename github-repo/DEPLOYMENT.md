# Deployment Guide

Deploy SignLess to production hosting platforms.

## Prerequisites

- GitHub account
- Code pushed to GitHub repository
- Environment variables ready
- Funded Solana wallet (minimum 0.001 SOL)

## Railway Deployment

Railway offers automatic deployments from GitHub with a generous free tier.

### Step 1: Create Railway Account

Visit https://railway.app and sign up with GitHub.

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your SignLess repository
4. Railway will automatically detect Node.js

### Step 3: Configure Environment Variables

In Railway dashboard, go to Variables tab and add:

```
PORT=3000
RECEIVER_WALLET_ADDRESS=your_wallet_address
VERIFICATION_AMOUNT=0.00001
SESSION_TIMEOUT=300000
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
CORS_ORIGINS=https://yourfrontend.com
```

### Step 4: Generate Domain

1. Go to Settings > Networking
2. Click "Generate Domain"
3. Copy your Railway URL (e.g., https://signless-demo-backend-production.up.railway.app)

### Step 5: Update Frontend

Update your frontend API_URL to point to your Railway domain.

**Cost:** Free tier includes $5/month credit, then $0.000231/GB-hour

---

## Render Deployment

Render provides free hosting for web services.

### Step 1: Create Render Account

Visit https://render.com and sign up.

### Step 2: Create New Web Service

1. Click "New +" > "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: signless-api
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

### Step 3: Add Environment Variables

In Environment tab, add all required variables.

### Step 4: Deploy

Click "Create Web Service". Render will build and deploy automatically.

**Cost:** Free tier available with limitations, paid plans start at $7/month

---

## Vercel Deployment

Vercel offers serverless deployment with automatic scaling.

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Deploy

From your project directory:

```bash
vercel
```

Follow the prompts to link your project.

### Step 3: Configure Environment Variables

```bash
vercel env add RECEIVER_WALLET_ADDRESS
vercel env add SOLANA_RPC_URL
vercel env add CORS_ORIGINS
```

Or add them in the Vercel dashboard under Settings > Environment Variables.

### Step 4: Redeploy

```bash
vercel --prod
```

**Cost:** Free tier includes 100GB bandwidth, then $20/month for Pro

---

## Heroku Deployment

Heroku offers traditional platform-as-a-service hosting.

### Step 1: Install Heroku CLI

Download from https://devcenter.heroku.com/articles/heroku-cli

### Step 2: Login and Create App

```bash
heroku login
heroku create signless-api
```

### Step 3: Set Environment Variables

```bash
heroku config:set RECEIVER_WALLET_ADDRESS=your_address
heroku config:set SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
heroku config:set CORS_ORIGINS=https://yourfrontend.com
```

### Step 4: Deploy

```bash
git push heroku main
```

**Cost:** Free tier deprecated, starts at $5/month for Eco dynos

---

## DigitalOcean App Platform

### Step 1: Create App

1. Go to DigitalOcean App Platform
2. Click "Create App"
3. Connect GitHub repository

### Step 2: Configure

- Build Command: `npm install`
- Run Command: `npm start`
- HTTP Port: 3000

### Step 3: Add Environment Variables

Add all required variables in the App settings.

**Cost:** Starting at $5/month for basic apps

---

## Custom VPS Deployment

For deploying to your own server (Ubuntu/Debian).

### Step 1: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Clone Repository

```bash
git clone https://github.com/yourusername/signless.git
cd signless
npm install
```

### Step 3: Configure Environment

```bash
cp .env.example .env
nano .env
```

Add your configuration values.

### Step 4: Install PM2

```bash
sudo npm install -g pm2
pm2 start src/server.js --name signless
pm2 startup
pm2 save
```

### Step 5: Configure Nginx

```bash
sudo apt install nginx

sudo nano /etc/nginx/sites-available/signless
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/signless /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment-Specific Configuration

### Development

```env
CORS_ORIGINS=*
SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Staging

```env
CORS_ORIGINS=https://staging.yourdomain.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Production

```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SOLANA_RPC_URL=https://your-paid-rpc-endpoint.com
```

---

## Post-Deployment Checklist

- [ ] Test /health endpoint
- [ ] Verify CORS configuration
- [ ] Test full authentication flow
- [ ] Monitor server logs
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure monitoring (e.g., UptimeRobot)
- [ ] Document your API URL
- [ ] Update frontend with production API URL
- [ ] Test from production frontend
- [ ] Monitor wallet balance
- [ ] Set up backup RPC endpoints

---

## Monitoring and Maintenance

### Logs

**Railway:** View logs in dashboard

**Render:** Logs tab in dashboard

**PM2:** `pm2 logs signless`

### Restart Server

**Railway:** Auto-restarts on code push

**Render:** Manual restart in dashboard

**PM2:** `pm2 restart signless`

### Update Deployment

```bash
git push origin main
```

Most platforms auto-deploy on push.

---

## Troubleshooting

### Deployment Fails

- Check build logs for errors
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

### Environment Variables Not Working

- Verify variable names match exactly
- No quotes needed in most platforms
- Restart service after adding variables

### CORS Errors

- Check CORS_ORIGINS includes your frontend domain
- Use full URL with protocol (https://)
- Multiple origins: comma-separated, no spaces

### RPC Rate Limiting

Consider paid RPC providers:
- Helius: 100k requests/day free tier
- QuickNode: Dedicated nodes from $9/month
- Alchemy: 300M compute units/month free

---

## Security Best Practices

1. Never commit .env file
2. Use environment variables for all secrets
3. Enable HTTPS (SSL/TLS)
4. Set specific CORS_ORIGINS in production
5. Implement rate limiting
6. Monitor for unusual transaction patterns
7. Keep dependencies updated
8. Use strong firewall rules
9. Regular security audits
10. Backup critical data

---

## Support

For deployment issues:
- Check platform-specific documentation
- Review server logs
- Test locally first
- Open GitHub issue for SignLess-specific problems
