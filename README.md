A SignLess x402 Checkout Stack

Modern, self-hosted tooling for building onchain checkouts that speak the **x402 micro-payment standard**. This repository contains:

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/db-PostgreSQL-blue.svg)

---

## What’s inside

```
signless/
├── src/                  # Express API (X4ZERO backend)
├── frontend/             # React + Vite checkout builder
├── cloudflare-frontend/  # Static marketing site (Cloudflare Pages ready)
├── prisma/               # Database schema & migrations (PostgreSQL)
├── docs/                 # Integration & deployment guides
└── examples/             # Copy-paste integration snippets
```

### Backend highlights

- Merchant auth (register/login/logout) with secure session cookies
- API key issuance + management
- Checkout CRUD with strong validation (USDC, 6-decimal amounts)
- x402 compliant payment requirement responses (`scheme`, `network`, `asset`, `maxAmountRequired`)
- `/payments/requirements/:merchantSlug/:checkoutSlug` returning `402 Payment Required`
- Health probe (`/health`) and ready-to-deploy CORS configuration

### Builder highlights

- Visual configuration for product pricing, automation targets, and UI copy
- Live preview with USDC minor-unit conversions
- Export bundles for React checkout, Express invoice endpoint, watcher runtime, and `.env`
- Local persistence, curated presets, and JSON download to share configs

### Tooling & quality gates

- Jest + Supertest for backend smoke coverage
- Vitest suite for builder export utilities
- Vite production build verified (`frontend/dist`)
- Prisma migrations (PostgreSQL / JSONB columns) checked in

---

## Quick start (local development)

### 1. Requirements

- Node.js 18+
- npm 10+
- PostgreSQL 13+ (or Docker if you prefer containers)
- Git (optional but recommended)

> 💡 No Docker? No problem. Use any Postgres instance and update `DATABASE_URL` accordingly.

### 2. Clone & install

```powershell
git clone https://github.com/charliekarlsson/signless-demo-frontend.git signless
cd signless

# Backend dependencies
npm install

# Frontend builder deps
cd frontend
npm install
cd ..
```

### 3. Provision the database

#### Option A – Docker (recommended)

```powershell
docker compose up -d
```

This starts a Postgres 16 container with credentials matching `.env.example`.

#### Option B – External Postgres

- Create a database (e.g. on Railway, Neon, Supabase)
- Copy the connection string into `.env` → `DATABASE_URL`

### 4. Environment variables

```powershell
cp .env.example .env
```

Key settings:

| Variable | Purpose | Default |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://signless:signless@localhost:5432/signless?schema=public` |
| `JWT_SECRET` | Session token signing secret | `replace-with-strong-secret` |
| `CORS_ORIGINS` | Allowed web origins | `http://localhost:5173` |
| `RECEIVER_ADDRESS` | Default USDC receiver used in exports | `0x0000...` |
| `RPC_PRIMARY` | Base Sepolia RPC URL | `https://sepolia.base.org` |

### 5. Generate Prisma client + apply migration

```powershell
npm run prisma:generate
npm run prisma:deploy
```

This applies the checked-in migration `20251114180000_init` to your database.

### 6. Start services

```powershell
# Backend API on http://localhost:3000
npm run dev

# In another terminal:
cd frontend
npm run dev  # Checkout builder on http://localhost:5173
```

> Optional: `cloudflare-frontend/index.html` can be served with `npx wrangler pages dev .` for the marketing site.

---

## Verification & quality gates

Run the automated checks before shipping:

```powershell
# Backend smoke tests (Jest + Supertest)
npm test

# Frontend unit tests (Vitest)
cd frontend
npm test -- --run

# Production build of the builder
npm run build
```

### Current status

- ✅ Backend tests pass (`tests/health.test.js`)
- ✅ Builder tests pass (`builderCheckout` suite)
- ✅ Vite production build succeeds
- ⚠️ `npm install` reports moderate vulnerabilities from `supertest`’s dependency chain. Run `npm audit` periodically for patches.

---

## Backend API overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | `POST` | Create user + merchant profile, auto-issues API key |
| `/api/auth/login` | `POST` | Email/password login, HTTP-only session cookies |
| `/api/auth/logout` | `POST` | Destroy session cookie |
| `/api/auth/me` | `GET` | Returns current user + merchant metadata |
| `/api/merchant/profile` | `GET/PUT` | Read/update merchant branding + webhook |
| `/api/merchant/api-keys` | `POST/DELETE` | Rotate API keys |
| `/api/checkouts` | `CRUD` | Manage checkout definitions (amount, network, asset) |
| `/api/checkouts/:id/payment-requirement` | `GET` | Returns x402 payment bundle |
| `/api/payments/supported` | `GET` | Enumerates scheme/network pairs |
| `/api/payments/requirements/:merchantSlug/:checkoutSlug` | `GET` | Emits `402` with `x-payment-requirements` payload |
| `/health` | `GET` | Health probe with timestamp/environment |

All responses are JSON. Requests require the session cookie unless noted otherwise.

### x402 response example

```json
{
  "x402Version": 1,
  "accepts": [
   {
    "scheme": "exact",
    "network": "base-sepolia",
    "description": "Orbit Checkout",
    "mimeType": "application/json",
    "maxAmountRequired": "25000000",
    "payTo": "0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1",
    "asset": "0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1",
    "extra": {
      "currency": "USDC",
      "checkoutId": "ckout_123",
      "successUrl": "https://app.orbit.dev/dashboard"
    }
   }
  ]
}
```

---

## Checkout builder (React + Vite)

- `npm run dev` – start local builder at `http://localhost:5173`
- `npm run build` – generate static bundle (`frontend/dist`)
- `npm test -- --run` – execute Vitest coverage for export helpers

Key files:

| File | Purpose |
|------|---------|
| `src/components/BuilderApp.jsx` | Main UI / state management |
| `src/utils/builderCheckout.js` | Normalises config → checkout payload / minor units |
| `src/utils/exportGenerators.js` | Generates copy-ready snippets |
| `src/constants/payments.js` | Network + currency metadata |

Use the builder to produce:

- React checkout wrapper (imports `@signless/x402-react`)
- Express invoice endpoint responding with `402`
- Watcher runtime snippet (session store + webhook integration)
- `.env` template listing secrets and RPC URLs

---

## Marketing site (Cloudflare Pages)

Located in `cloudflare-frontend/` with a minimal setup:

```powershell
cd cloudflare-frontend
npm install
npm run dev      # wrangler pages dev .
npm run deploy   # deploy to Cloudflare Pages
```

Update copy in `index.html` and styles in `styles.css` to match your brand. The README in that folder explains deployment via GitHub Pages, Netlify, or Vercel if you prefer other hosts.

---

## Production deployment checklist

1. **Environment**
  - [ ] Generate strong `JWT_SECRET`
  - [ ] Set `CORS_ORIGINS` to explicit domains
  - [ ] Configure `RECEIVER_ADDRESS` per checkout requirements
  - [ ] Add RPC provider URLs + API keys (Alchemy, QuickNode, etc.)

2. **Database**
  - [ ] Provision managed Postgres (e.g. Railway, Supabase)
  - [ ] Run `npm run prisma:deploy`
  - [ ] Schedule backups + monitoring

3. **Backend**
  - [ ] `npm ci --only=production`
  - [ ] `npm run build` (optional bundler such as `tsup` if you add TypeScript)
  - [ ] Run under a process manager (PM2, systemd, Docker)
  - [ ] Enforce HTTPS + rate limiting (e.g. via reverse proxy)

4. **Builder + website**
  - [ ] `cd frontend && npm run build`
  - [ ] Upload `frontend/dist` to static host (Cloudflare Pages, Netlify, Vercel)
  - [ ] Update marketing site CTAs to point at live checkout URLs

5. **Monitoring & alerts**
  - [ ] Hook up watchdog runtime webhook URL
  - [ ] Track payment verification latency
  - [ ] Log API errors (Winston/Datadog/etc.)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm test` fails with Prisma errors | Ensure `NODE_ENV=test` (default) and that `src/lib/prisma.js` stub is loaded. No database is required for tests. |
| `prisma migrate` complains about JSON fields | Confirm you are using PostgreSQL. SQLite does not support JSONB columns. |
| `docker compose` command missing | Install Docker Desktop or use a managed Postgres provider. |
| Builder shows Solana defaults | Clear `localStorage` (`localStorage.removeItem('signless-builder-config')`) to load updated presets. |
| `wrangler` deploy fails | Run `npm install` inside `cloudflare-frontend/` to install the Wrangler CLI locally. |

---

## Contributing

1. Fork the repo & create a feature branch.
2. Run `npm test` (root) and `cd frontend && npm test -- --run` locally.
3. Submit a PR with a clear summary. Automated checks should pass.

Bug reports and feature requests are welcome via GitHub issues.

---

## License

MIT © 2025 X4ZERO contributors

````
