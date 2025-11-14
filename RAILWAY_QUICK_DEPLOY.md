git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/YOUR_USERNAME/solana-auth.git
git branch -M main
git push -u origin main
git add .
git commit -m "Updated feature"
git push
# ⚡ 5-Minute Railway Deployment (Backend)

Spin up the x4zero backend with a managed PostgreSQL database in just a few minutes.

## 🎯 Result

- ✅ Node API running 24/7 with HTTPS
- ✅ Managed PostgreSQL attached automatically
- ✅ Environment variables configured via dashboard
- ✅ Deploys on every Git push

---

## 📋 Prerequisites

- Project code pushed to GitHub (`main` branch recommended)
- Railway account (free to start)

---

## 🚀 Step-by-Step

### 1. Push the code (if you haven’t already)

```powershell
cd signless
git init
git add .
git commit -m "Deploy backend to Railway"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/signless.git
git push -u origin main
```

### 2. Create the Railway project

1. Go to [railway.app](https://railway.app) → **Start a New Project** → **Deploy from GitHub repo** → select your repo.
2. Pick the **Node.js** template when prompted (Railway auto-detects `npm start`).
3. After the service is created, click **Add → Database → PostgreSQL**. Railway now provisions a managed database and links it to your service.

### 3. Configure environment variables

1. Inside the service, open **Variables → Raw Editor**.
2. Paste the following values (tweak the URLs to match your domains):

```
NODE_ENV=production
PORT=3000
JWT_SECRET=replace-with-long-random-string
CORS_ORIGINS=https://dashboard.yourdomain.com,https://pay.yourdomain.com
RECEIVER_ADDRESS=0x0000000000000000000000000000000000000000
RPC_PRIMARY=https://mainnet.base.org
RPC_FALLBACK=https://rpc.ankr.com/base
```

> Railway injects `DATABASE_URL` automatically from the linked PostgreSQL service. No need to add it manually.

### 4. Ensure migrations run on boot

Under **Service → Settings → Start Command**, set:

```

```

This applies database migrations before the API starts accepting traffic. (Optional) set **Install Command** to `npm ci` for faster deterministic installs.

### 5. Deploy & verify

Railway deploys automatically once the configuration saves. After the deploy turns green, test the health endpoint:

```powershell
curl https://your-service.up.railway.app/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-11-14T12:34:56.000Z",
  "environment": "production"
}
```

### 6. Update your frontend(s)

Point `VITE_API_URL` (for the builder) or any static demo scripts to the Railway URL:

```env
VITE_API_URL=https://your-service.up.railway.app
```

Redeploy the frontend so it talks to the live API.

---

## 🌐 Domains & HTTPS

- Railway assigns a default domain like `https://your-service.up.railway.app` with HTTPS pre-configured.
- To use `api.yourdomain.com`, go to **Settings → Domains**, add the hostname, and follow the DNS instructions. Update `CORS_ORIGINS` afterwards.

---

## � Continuous delivery

Every push to the tracked branch (default `main`) triggers a redeploy. Keep migrations in version control so Railway can apply them during the `Start Command` step.

---

## 📈 Monitoring & logs

- **Deployments tab** shows the build logs and status.
- **Metrics tab** gives CPU, memory, and response time charts.
- Use `railway logs` with the CLI for real-time streaming if needed.

Optional CLI workflow:

```powershell
npm install -g @railway/cli
railway login
railway up          # trigger deploy from local changes
railway logs        # stream logs
```

---

## 🆘 Troubleshooting cheatsheet

| Issue | Fix |
|-------|-----|
| Deploy fails with Prisma error | Ensure migrations exist (`prisma/migrations`) and keep `npx prisma migrate deploy` in the start command |
| 500 errors mentioning `JWT_SECRET` | Secret missing → set it in Railway variables |
| Browser CORS failures | Add your web origins to `CORS_ORIGINS` (comma-separated, no spaces) |
| Database connection refused | Verify the PostgreSQL service is running and linked; redeploy to refresh `DATABASE_URL` |

---

Your backend is now live on Railway 🎉  Next step: deploy the frontend builder (see `DEPLOY_PRODUCTION.md`) and run an end-to-end payment test.

