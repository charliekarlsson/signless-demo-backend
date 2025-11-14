# SignLess Managed Merchant Platform Architecture

## 1. Product Vision

Deliver a fully managed X402 checkout service where merchants only provide a receiver wallet address. SignLess handles session creation, invoice management, watcher infrastructure, and shopper UI. Merchants embed a single HTML snippet (or hosted checkout link) to start accepting onchain payments.

## 2. Primary User Journeys

1. **Merchant onboarding**
   - Visit marketing site → click "Start for free"
   - Create account (email + password) or OAuth
   - Enter receiver wallet + business name
   - Optionally set brand color / success redirect / notifications
   - Receive embed script + dashboard access

2. **Checkout integration**
   - Drop `<script src="https://pay.signless.xyz/widget.js" data-merchant-id="..." data-checkout="default"></script>` into site *or*
   - Link to hosted checkout `https://pay.signless.xyz/m/<slug>`
   - Customers flow through SignLess checkout, watcher confirms transaction, webhook notifies merchant

3. **Merchant operations**
   - Dashboard shows transaction volume, customer list, payout status
   - Manage API keys, webhooks, success redirects, optional product configuration (amount, memo, deliverable type)
   - Upgrade plan when transaction limits exceeded

## 3. High-Level Architecture

```
┌──────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│ Marketing Site   │ ───▶ │ Merchant Dashboard │ ───▶ │ REST / GraphQL API │
└──────────────────┘      └────────────────────┘      └────────────────────┘
                                                            │
                                                            ▼
                                                    ┌────────────────┐
                                                    │ Core Services  │
                                                    │ - Checkout     │
                                                    │ - Sessions     │
                                                    │ - Watcher      │
                                                    │ - Billing      │
                                                    └────────────────┘
                                                            │
                                                            ▼
                                                 ┌─────────────────────┐
                                                 │ Blockchain Runtimes │
                                                 │ (RPC Providers)     │
                                                 └─────────────────────┘
```

### Core backend domains

- **Identity Service** – manages merchants, auth, roles, billing tier
- **Checkout Service** – stores checkout definitions (amount, memo, success redirect, theme)
- **Session Service** – creates & tracks live checkout sessions, handles rate limiting
- **Watcher / Verification Service** – monitors chain for matching transactions and finalizes sessions
- **Notification Service** – webhooks, email receipts, Slack/Discord alerts
- **Reporting & Analytics** – aggregates volume, conversion, payout history

### Infrastructure components

| Component              | Initial Choice                    | Notes |
|------------------------|-----------------------------------|-------|
| Application runtime    | Cloudflare Workers or Node + Edge | API + widget distribution |
| Database               | Postgres (Supabase/Neon/Railway)  | Multi-tenant data storage |
| Session cache          | Redis / Upstash                   | Fast session lookups |
| Watcher runtime        | Dedicated worker (cron)           | Poll RPC, stream signatures |
| RPC provider           | Helius/Triton/QuickNode           | 100–500 requests/day per merchant |
| Object store           | Cloudflare R2/S3                  | Asset hosting, logs |
| Auth & billing         | Clerk/Auth0 + Stripe Billing      | Optional for launch |

## 4. Data Model Sketch

```mermaid
er diagram
    merchants ||--o{ checkouts : owns
    merchants ||--o{ api_keys : has
    merchants ||--o{ sessions : initiates
    merchants ||--o{ webhooks : configures
    merchants {
        uuid id
        text email
        text password_hash
        text wallet_address
        text business_name
        text brand_color
        text plan
        timestamptz created_at
        timestamptz updated_at
    }
    checkouts {
        uuid id
        uuid merchant_id
        text slug
        numeric amount
        text currency
        text memo
        text theme
        text success_redirect
        boolean collect_email
        jsonb metadata
        timestamptz created_at
    }
    sessions {
        uuid id
        uuid checkout_id
        text customer_wallet
        numeric amount
        text tx_signature
        text status
        timestamptz expires_at
        timestamptz settled_at
    }
    webhooks {
        uuid id
        uuid merchant_id
        text url
        text secret
        boolean enabled
        timestamptz created_at
    }
```

## 5. Checkout Flow (Managed)

1. Shopper loads merchant site with SignLess widget.
2. Widget fetches checkout definition via public endpoint `/v1/checkouts/:slug`.
3. Shopper enters optional email and clicks "Pay".
4. Widget requests new session `/v1/sessions`. Backend returns session ID + onchain invoice memo.
5. Widget triggers wallet using SignLess-managed program or simple SOL transfer.
6. Watcher service listens for matching transfer (receiver wallet + memo + amount).
7. Upon confirmation, Session Service marks session `settled`, sends webhook + optional email receipt.
8. Widget redirects to success page or shows confirmation.

## 6. Integration Interfaces

### HTML Embed

```html
<script
  src="https://pay.signless.xyz/widget.js"
  data-merchant-id="MERCHANT_UUID"
  data-checkout="default"
  data-theme="nebula"
  defer
></script>
```

### Hosted Checkout

```
https://pay.signless.xyz/m/{checkout-slug}
```

### Webhooks

```
POST https://merchant.com/webhooks/signless
{
  "event": "session.settled",
  "data": {
    "sessionId": "...",
    "checkoutId": "...",
    "amount": "0.000010",
    "txSignature": "...",
    "customerWallet": "..."
  }
}
```

## 7. Roadmap Phases

1. **Phase 1 – MVP (Weeks 1-3)**
   - Marketing site repositioned for managed platform
   - Merchant dashboard with wallet onboarding + checkout preview
   - Managed API issuing session IDs + webhook stub
   - Hosted checkout page + JS embed

2. **Phase 2 – Scale (Weeks 4-6)**
   - Subscription plans + metered billing
   - Analytics dashboard (transactions/day, conversion)
   - Multi-chain beta (extend watcher adapters)
   - Hardened watcher (retry logic, alerting)

3. **Phase 3 – Premium Features (Weeks 7+)**
   - Custom domains for hosted checkout
   - Receipts + email alerts
   - Role-based access for teams
   - API keys for server-side integrations

## 8. Security & Compliance Notes

- Enforce wallet ownership verification during onboarding (signature challenge)
- Encrypt sensitive merchant data (webhook secrets, API keys)
- Implement rate limiting on session creation endpoints
- Maintain audit trail of sessions + callbacks
- Provide GDPR-compliant data export/delete functionality

## 9. Dependencies to Rework

| Area                 | Current State                                      | Transition Plan |
|----------------------|----------------------------------------------------|-----------------|
| React builder app    | DIY checkout configuration & code exports          | Convert into merchant dashboard + widget configurator |
| Export generators    | Generates frontend/backend snippets                 | Replace with hosted embed code & API key issuance |
| Docs                 | Focused on self-hosting                            | Rewrite for "hosted checkout" onboarding |
| Backend templates    | Express server + watcher code                       | Transition to managed multitenant services (services folder becomes internal) |
| Marketing site       | Promotes builder download                          | Reframe to highlight managed platform, pricing tiers |

## 10. Next Steps

1. Update marketing copy + CTAs to push merchants into account creation flow.
2. Implement dashboard authentication shell with placeholder API.
3. Build managed checkout widget skeleton (React/Vite microbundle).
4. Stub backend endpoints in `src/` to mimic managed service for demo purposes.
5. Replace exports with embed code + API instructions.
6. Refresh documentation and deployment scripts.
