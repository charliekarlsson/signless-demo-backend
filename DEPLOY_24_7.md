git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/solana-auth.git
git branch -M main
git push -u origin main
echo "web: npm start" > Procfile
git add Procfile
git commit -m "Add Procfile for Heroku"
git push heroku main
git clone https://github.com/yourusername/solana-auth.git
# 🌐 Deploy for 24/7 Availability

Everything below assumes the current **PostgreSQL + Prisma + Express** backend and the **React/Vite** checkout builder. Follow these steps so the product keeps running even when your development machine is offline.

---

## 🎯 Deployment overview

| Provider | DB Support | Cost (approx.) | Difficulty | Notes |
|----------|-----------|----------------|------------|-------|
| **Railway** | Managed Postgres | $5/mo (first $5 free) | ⭐ Easy | All-in-one, recommended |
| **Render** | Managed Postgres | $7/mo always-on | ⭐ Easy | Free tier sleeps |
| **Fly.io** | Bring-your-own Postgres | $5-10/mo | ⭐⭐ Medium | Scale to multiple regions |
| **DigitalOcean App Platform** | Managed Postgres | $12/mo+ | ⭐⭐ Medium | More control |
| **AWS/GCP/Azure** | Managed Postgres | varies ($15+) | ⭐⭐⭐ Advanced | Enterprise compliance |

Regardless of the platform, deployment boils down to four tasks:

1. **Ship the backend** (`npm start`) with `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS` and RPC defaults configured.
2. **Run Prisma migrations** in production (`npx prisma migrate deploy`).
3. **Provision PostgreSQL** and connect it via `DATABASE_URL`.
4. **Publish the frontend bundle** so it points at the production API.

---

## Option 1 — Railway (recommended path)

Follow the dedicated quickstart in `RAILWAY_QUICK_DEPLOY.md`. Highlights:

- Deploy the repo from GitHub.
- Add the managed PostgreSQL service (Railway links `DATABASE_URL`).
- Set variables:

  ```env
  NODE_ENV=production
  PORT=3000
  JWT_SECRET=super-long-random-string
  CORS_ORIGINS=https://dashboard.yourdomain.com,https://pay.yourdomain.com
  RECEIVER_ADDRESS=0x0000000000000000000000000000000000000000
  RPC_PRIMARY=https://mainnet.base.org
  RPC_FALLBACK=https://rpc.ankr.com/base
  ```

- Use `npx prisma migrate deploy && npm start` as your start command so migrations run automatically.
- Verify `https://<railway-domain>/health` returns `status: "ok"`.
- Point the frontend (`VITE_API_URL`) to the Railway domain.

Railway includes logs, metrics, rollbacks, and custom domains out of the box.

---

## Option 2 — Render

Steps mirror Railway but you must manually provision PostgreSQL:

1. Create a **Web Service** (Node) from your GitHub repo.
2. Add a **PostgreSQL** instance in the same Render project.
3. Render exposes `DATABASE_URL` after provisioning; add the remaining variables from the list above.
4. Build command: `npm install` (or `npm ci` if you commit `package-lock.json`).
5. Start command: `npm run prisma:deploy && npm start`.
6. Enable the paid **Starter** plan if you need always-on availability (free tier sleeps when idle).

---

## Option 3 — Bring-your-own server (DigitalOcean / Fly.io / VPS)

For finer control you can use a VPS or container platform.

1. Provision a Linux host (Ubuntu 22.04 LTS recommended) or deploy a Docker image.
2. Install Node 18+, Git, and PM2 (or use Docker).
3. Use a managed PostgreSQL provider (DigitalOcean Managed DB, Supabase, Neon, CrunchyBridge) and grab the connection string.
4. Clone the repo, run `npm ci`, copy `prisma/.env` to `.env`, and set:

   ```bash
   export NODE_ENV=production
   export DATABASE_URL=postgresql://...
   export JWT_SECRET=...
   export CORS_ORIGINS=https://...
   export RECEIVER_ADDRESS=0x...
   export RPC_PRIMARY=https://...
   ```

5. Run `npx prisma migrate deploy`.
6. Start the service with PM2 (`pm2 start src/server.js --name x4zero-backend`) or via Docker Compose.
7. Put Nginx/Traefik in front for HTTPS and configure a system firewall (allow ports 22, 80, 443).

Fly.io alternative: build a Docker image and deploy `fly deploy`. Use Fly Postgres or external provider.

---

## Frontend hosting options

| Platform | Command | Notes |
|----------|---------|-------|
| **Vercel** | Import repo → root `frontend/` | Automatic builds, preview deployments |
| **Netlify** | `npm run build` locally → upload `frontend/dist` | Simple drag-and-drop |
| **Cloudflare Pages** | `npm run build` → connect Git repo | Great for the marketing/demo bundles |
| **Static S3 + CloudFront** | Upload `dist/` | Enterprise setups |

Set `VITE_API_URL` (via dashboard or environment file) so the builder hits the production backend.

---

## Production environment variables (recap)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?schema=public
JWT_SECRET=super-long-random-string
CORS_ORIGINS=https://dashboard.example.com,https://pay.example.com
RECEIVER_ADDRESS=0x0000000000000000000000000000000000000000
RPC_PRIMARY=https://mainnet.base.org
RPC_FALLBACK=https://rpc.ankr.com/base
``` 

- Add any monitoring secrets (e.g., `SENTRY_DSN`) if you wire them in.
- Avoid `*` in `CORS_ORIGINS`; list explicit origins separated by commas.

---

## ✅ Pre-launch checklist

- [ ] `npm test` (backend) and `npm test`/`npm run build` (frontend) succeed locally.
- [ ] PostgreSQL provisioning confirmed; migrations applied in production.
- [ ] Admin login + checkout creation works end-to-end in staging/production.
- [ ] `/health` endpoint reports `status: "ok"`.
- [ ] `JWT_SECRET` is set and kept secret.
- [ ] Backups scheduled for the database (Railway handles automatically; confirm retention).
- [ ] Uptime monitoring configured (e.g., [UptimeRobot](https://uptimerobot.com/) pinging `/health`).
- [ ] Error monitoring or log alerts enabled (Railway logs, Render alerts, Sentry, etc.).
- [ ] Frontend builder deployed and pointing at production API.

---

## 🆘 Common issues & fixes

| Error | Diagnosis | Fix |
|-------|-----------|-----|
| `Error: JWT_SECRET environment variable is not set` | Secret missing in the host | Add `JWT_SECRET` to env vars; redeploy |
| Prisma connection failures | Wrong or unreachable `DATABASE_URL` | Regenerate connection string, ensure networking rules allow access |
| Browser rejects cookies | Production domain not using HTTPS | Use SSL certificates / provider-managed HTTPS |
| CORS errors in console | Frontend origin not allowed | Update `CORS_ORIGINS` with exact domains |
| Deploy loop with migrations | Migrations missing in repo or failing | Run locally, commit, and redeploy; check logs for SQL errors |

---

## Monitoring & maintenance

- **Health checks**: `/health` returns JSON; wire into uptime monitors.
- **Logs**: Stream via provider dashboards or CLIs.
- **Backups**: Railway/Render offer automatic snapshots; verify schedule.
- **Scaling**: Upgrade plans or allocate more CPU/RAM if request volume grows.
- **Secrets rotation**: Rotate `JWT_SECRET` and any API keys regularly.

---

With the backend deployed, database migrations running automatically, and the frontend pointing at the live API, your product is ready to operate around the clock. 🎉
