git add .
git commit -m "Initial commit - SignLess v2.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/signless.git
git push -u origin main
git init
git add .
git commit -m "Deploy SignLess"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
# 🚀 Deploy SignLess (x4zero stack) to Production

This guide walks you through deploying the **Node + Postgres** backend and the **React checkout builder** so merchants can run x402 USDC checkouts in production.

At a minimum you need:

- A GitHub repository for this project
- A managed PostgreSQL database (Railway, Render, Supabase, Neon, etc.)
- An HTTPS-capable hosting environment for the Node API
- Somewhere to host the frontend bundle (Vercel, Netlify, Cloudflare Pages, S3+CloudFront …)

The instructions below focus on **Railway** for the backend (because it gives you a managed PostgreSQL instance + Node service in a few minutes) and **Vercel** for the frontend. Adapt the same concepts to other providers.

---

## 🧱 Environment Variables Reference

Create the following variables in your hosting provider before deploying:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public
JWT_SECRET=replace-with-long-random-string
CORS_ORIGINS=https://your-dashboard.example,https://www.your-checkout.example

# Optional defaults that power the checkout builder / API fallbacks
RECEIVER_ADDRESS=0x0000000000000000000000000000000000000000
RPC_PRIMARY=https://mainnet.base.org
RPC_FALLBACK=https://rpc.ankr.com/base
```

Keep `JWT_SECRET` private and never commit real values to Git.

---

## Option 1 — Railway (Backend) ✅ Recommended

Railway gives you a managed PostgreSQL instance, auto-deploys from GitHub, and keeps everything running 24/7 with minimal setup.

### 1. Prepare your repo

```powershell
cd signless
git init
git add .
git commit -m "Prepare x4zero production deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/signless.git
git push -u origin main
```

### 2. Create services on Railway

1. Visit [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project → Deploy from GitHub Repo** and select your repo.
3. When prompted, choose the **Node.js** template.
4. After the service is created, click **Add → Database → PostgreSQL** to provision a managed database in the same project.

Railway automatically injects `DATABASE_URL` into the service once the DB is linked.

### 3. Configure variables and start command

Inside the service settings:

1. Open the **Variables** tab → **Raw Editor** and paste the variables from the reference section above (Railway will already supply `DATABASE_URL`).
2. Set `Start Command` to:

```
npx prisma migrate deploy && npm start
```

This ensures migrations run before the server boots.

3. (Optional) Set `Install Command` to `npm ci` for deterministic installs.

### 4. Trigger a deploy and verify

Railway deploys automatically after any change. You can also click **Deploy** manually.

Once the deploy shows green:

```powershell
curl https://your-service.up.railway.app/health
```

Expected output:

```json
{
  "status": "ok",
  "timestamp": "2025-11-14T12:34:56.000Z",
  "environment": "production"
}
```

### 5. Obtain the production API URL

Railway assigns a default domain (`https://your-service.up.railway.app`). You can add a custom domain under **Settings → Domains** once DNS is configured. Remember to mirror the domain list in `CORS_ORIGINS`.

---

## Option 2 — Render (Backend)

Render offers a generous free tier and managed PostgreSQL. Setup is similar to Railway:

1. Push your code to GitHub (same steps as above).
2. Create a **Web Service** (Node) and a **PostgreSQL** instance in the same Render project.
3. Add the environment variables from the reference section; Render will expose a `DATABASE_URL` once the database is provisioned.
4. Set the **Build Command** to `npm install` and the **Start Command** to `npm run prisma:deploy && npm start`.
5. Deploy and check `/health`.

⚠️ Render’s free tier spins down after inactivity. Upgrade to the Starter plan for always-on availability.

---

## Frontend Deployment (Vercel example)

The checkout builder (`frontend/`) is a standard Vite + React app.

1. From Vercel’s dashboard click **New Project → Import Git Repository** and select `frontend/`.
2. Set the **Root Directory** to `frontend`.
3. Add environment variables:

```env
VITE_API_URL=https://your-production-backend.example
```

4. Vercel automatically runs `npm install` and `npm run build`.
5. Once deployed, the builder is available at the assigned Vercel URL or your custom domain.

For alternatives, you can run `npm run build` locally and upload the `frontend/dist` folder to Netlify, Cloudflare Pages, or any static host.

---

## Cloudflare static demos

The `cloudflare-frontend/` and `website/` directories are production-ready static exports for marketing/demo pages. Deploy them by uploading their contents to Cloudflare Pages or another static host and point `script.js` to your live API URL.

---

## ✅ Production Readiness Checklist

- [ ] Backend deployed with migrations applied (`npx prisma migrate deploy`).
- [ ] PostgreSQL database reachable from the backend service.
- [ ] `JWT_SECRET` set to a strong random value.
- [ ] `CORS_ORIGINS` locked down to trusted domains.
- [ ] Frontend (`VITE_API_URL`) points to the production API.
- [ ] `npm test` (backend) and `npm test` + `npm run build` (frontend) are passing.
- [ ] `/health` endpoint returns `status: "ok"` in production.
- [ ] Optional monitoring (Railway metrics, UptimeRobot, Sentry) configured.

---

## � Security & Operations Tips

- Use provider-managed secrets; never store `.env` locally with production values.
- Rotate `JWT_SECRET` and API keys periodically.
- Schedule database backups (Railway/Render provide automatic snapshots; verify retention policies).
- Restrict database access to the hosting network (managed by Railway/Render by default).
- Consider a paid Base RPC provider if you expect volume beyond public limits; update `RPC_PRIMARY` accordingly.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Deploy fails with `DATABASE_URL` missing | Database not linked or env var misnamed | Link the managed Postgres instance and redeploy |
| Server crashes on boot with `JWT_SECRET` error | Secret not set | Add `JWT_SECRET` in service variables |
| 401 errors from protected routes | Session cookie blocked by browser | Ensure production uses HTTPS so `secure` cookies are accepted |
| CORS errors in browser | Domain not listed in `CORS_ORIGINS` | Add comma-separated origins and redeploy |
| Prisma complains about migrations | Migrations not deployed | Run `npx prisma migrate deploy` before `npm start` |

---

Once the backend `/health` endpoint responds and the frontend builder is pointed at the production URL, your product is ready for real merchants. 🎉
