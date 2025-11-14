# 🚀 Split Hosting Setup Guide

## Architecture

```
┌─────────────────────────────────────┐
│   Cloudflare Pages (Frontend)      │
│   - Main website (index.html)       │
│   - Demo game (demo-game.html)      │
│   - All static assets                │
│   URL: yoursite.pages.dev           │
└───────────────┬─────────────────────┘
                │
                │ API Calls
                ▼
┌─────────────────────────────────────┐
│   Railway (Backend API)             │
│   - Node.js server                   │
│   - Authentication logic             │
│   - Blockchain monitoring            │
│   URL: signless-api.railway.app     │
└─────────────────────────────────────┘
```

---

## Part 1: Deploy Backend to Railway

### Step 1: Prepare Your Repository

Your backend only needs these files:
- `src/` folder
- `package.json`
- `.env.example`
- `node_modules/` (will be ignored)

### Step 2: Create .gitignore

```bash
# .gitignore
node_modules/
.env
website/
frontend/
docs/
logos/
*.log
.DS_Store
```

### Step 3: Push to GitHub

```bash
cd "c:\Users\charl\Desktop\Crypto 25-26\Utility Projects\signless"

# Initialize git
git init

# Add files
git add .

# Commit
git commit -m "SignLess v2.0 - Backend API"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/signless-backend.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `signless-backend` repo
6. Railway auto-detects Node.js and deploys!

### Step 5: Set Environment Variables in Railway

Go to your project → Variables tab → Add:

```env
RECEIVER_WALLET_ADDRESS=5sE9v2bPmHd3axXKXTi31tLmu8YkadLVcxgK76Pi8R3d
VERIFICATION_AMOUNT=0.00001
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SESSION_EXPIRY_MINUTES=15
CORS_ORIGINS=https://yoursite.pages.dev,https://yourdomain.com
NODE_ENV=production
```

**Important:** Add your Cloudflare Pages URL to CORS_ORIGINS!

### Step 6: Get Your Railway URL

Railway will give you a URL like:
```
https://signless-production-abc123.up.railway.app
```

Save this - you'll need it for the frontend!

---

## Part 2: Deploy Frontend to Cloudflare Pages

### Step 1: Prepare Frontend Files

Create a separate folder for your frontend:

```powershell
# Create a new directory for frontend only
mkdir c:\Users\charl\Desktop\signless-website
cd c:\Users\charl\Desktop\signless-website
```

### Step 2: Copy Website Files

Copy only the `website/` folder contents:
- `index.html`
- `demo-game.html`
- `styles.css`
- `script.js`
- `media/` folder (icons, logos)

### Step 3: Update API URL in Your Files

**In `demo-game.html`:**

Find this line:
```javascript
const API_URL = 'http://localhost:3000';
```

Change to:
```javascript
const API_URL = 'https://signless-production-abc123.up.railway.app';
```

**Important:** Use your actual Railway URL!

### Step 4: Create GitHub Repository for Frontend

```bash
cd c:\Users\charl\Desktop\signless-website

git init
git add .
git commit -m "SignLess frontend - v2.0"
git remote add origin https://github.com/YOUR_USERNAME/signless-website.git
git branch -M main
git push -u origin main
```

### Step 5: Deploy to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Workers & Pages** → **Create application** → **Pages**
3. **Connect to Git** → Select your `signless-website` repo
4. **Build settings:**
   - Build command: (leave empty - it's static HTML)
   - Build output directory: `/`
   - Root directory: `/`
5. Click **Save and Deploy**

### Step 6: Get Your Cloudflare URL

Cloudflare gives you:
```
https://signless-website.pages.dev
```

Or use a custom domain!

---

## Part 3: Connect Frontend to Backend

### Update CORS on Railway

Go back to Railway → Variables → Update `CORS_ORIGINS`:

```env
CORS_ORIGINS=https://signless-website.pages.dev,https://yourdomain.com
```

Click **Deploy** to apply changes.

### Test the Connection

Open your Cloudflare Pages site:
```
https://signless-website.pages.dev/demo-game.html
```

Try to authenticate - it should work! 🎉

---

## Part 4: Custom Domain (Optional)

### For Your Main Website (Cloudflare Pages)

1. In Cloudflare Pages → Custom domains
2. Add `yourdomain.com` and `www.yourdomain.com`
3. Cloudflare auto-configures DNS
4. SSL certificate auto-issued

### For Your API (Railway)

1. In Railway → Settings → Domains
2. Add `api.yourdomain.com`
3. Update your DNS:
   - Type: `CNAME`
   - Name: `api`
   - Value: (Railway provides this)

### Update Your Frontend

If using custom domains, update `demo-game.html`:

```javascript
const API_URL = 'https://api.yourdomain.com';
```

And update Railway CORS:
```env
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 📊 Final Architecture

```
User visits: https://yourdomain.com
    ↓
Cloudflare Pages serves HTML/CSS/JS
    ↓
JavaScript makes API calls to: https://api.yourdomain.com
    ↓
Railway backend handles auth, monitors blockchain
    ↓
User authenticated! ✅
```

---

## 💰 Costs

| Service | Purpose | Cost |
|---------|---------|------|
| **Railway** | Backend API | $5-10/month |
| **Cloudflare Pages** | Frontend hosting | **FREE** |
| **Total** | | **$5-10/month** |

Cloudflare Pages is completely free for unlimited sites! 🎉

---

## ✅ Checklist

### Backend (Railway)
- [ ] Create GitHub repo (backend only)
- [ ] Deploy to Railway
- [ ] Set environment variables
- [ ] Add Cloudflare Pages URL to CORS
- [ ] Get Railway URL

### Frontend (Cloudflare Pages)
- [ ] Create separate folder with website files
- [ ] Update API_URL to Railway URL
- [ ] Create GitHub repo (frontend only)
- [ ] Deploy to Cloudflare Pages
- [ ] Test connection

### Testing
- [ ] Visit your Cloudflare Pages site
- [ ] Try demo authentication
- [ ] Check Railway logs for requests
- [ ] Verify CORS is working

---

## 🚨 Common Issues

### "CORS Error"

**Problem:** Frontend can't call backend

**Solution:** 
1. Check Railway CORS_ORIGINS includes your Cloudflare URL
2. Redeploy Railway after changing variables

### "Network Error"

**Problem:** Frontend can't reach backend

**Solution:**
1. Check API_URL is correct in demo-game.html
2. Verify Railway service is running (check dashboard)

### "Authentication Fails"

**Problem:** Transactions not being detected

**Solution:**
1. Check Railway logs for errors
2. Verify RECEIVER_WALLET_ADDRESS is funded
3. Check SOLANA_RPC_URL is working

---

## 🔍 Monitoring

### Railway Dashboard
- View logs: Railway → Deployments → Logs
- Check uptime: Railway → Metrics
- View requests: Railway → Observability

### Cloudflare Analytics
- Page views
- Geographic distribution
- Performance metrics

---

## 🚀 Auto-Deploy Updates

### Backend Updates
1. Push changes to GitHub
2. Railway auto-deploys
3. Takes 1-2 minutes

### Frontend Updates
1. Update local files
2. Push to GitHub
3. Cloudflare auto-deploys
4. Takes 30 seconds

---

## 🎉 You're Done!

Your setup:
- ✅ **Frontend:** Fast, free, global CDN (Cloudflare)
- ✅ **Backend:** Always running, auto-scaling (Railway)
- ✅ **No PC needed:** Everything in the cloud
- ✅ **Auto-deploy:** Push to GitHub = instant deploy

---

## 📚 Quick Reference

**Frontend URL:** `https://signless-website.pages.dev`  
**Backend URL:** `https://signless-production.up.railway.app`  
**Demo URL:** `https://signless-website.pages.dev/demo-game.html`

**Railway Dashboard:** https://railway.app/dashboard  
**Cloudflare Dashboard:** https://dash.cloudflare.com

---

Need help? Check the logs in both dashboards! 🔍
