# X402 Checkout Builder Frontend

This React + Vite app powers the SignLess X402 checkout builder. It lets you compose branded checkouts, configure automation, and export ready-to-use frontend + backend bundles without touching a code editor.

## Quick start

```powershell
# Install dependencies
npm install

# Start the builder in dev mode
npm run dev
```

Open <http://localhost:5173> to iterate in real time. The builder automatically persists your work in `localStorage`, so you can refresh without losing edits.

## Key capabilities

- 🎛️ **Visual configuration wizard** – Update branding, product info, timers, and infrastructure all in one place.
- 🧱 **Flow timeline editor** – Reorder or write custom steps so the generated UI mirrors your ideal X402 journey.
- 🪄 **Live checkout preview** – See how your invoice, copy, and support states render as you type.
- 🧩 **Code exports** – Copy-ready snippets for the React checkout, Express invoice endpoint, watcher runtime, and `.env` scaffolding.
- 💾 **State persistence & presets** – Auto-save locally plus curated presets for API tiers or community passes.
- 📦 **One-click JSON bundle** – Download the entire configuration as `{slug}-builder.json` for handoff or version control.

## Available scripts

```powershell
# Development server with HMR
npm run dev

# Production build
npm run build

# Preview the production build locally
npm run preview

# Run the Vitest suite
npm test
```

## Project structure

```
src/
├── App.jsx                     # Entrypoint wiring the builder UI
├── components/
│   ├── BuilderApp.jsx          # Layout, state, presets, persistence
│   ├── CodePanel.jsx           # Tabbed export viewer + copy actions
│   ├── FlowEditor.jsx          # Timeline composer and timers
│   ├── PreviewPanel.jsx        # Live checkout preview surface
│   └── SectionFields.jsx       # Generic form renderer for schema fields
├── data/
│   └── builderSchema.js        # Default config + section metadata
├── utils/
│   ├── builderCheckout.js      # Normalises builder config into checkout payloads
│   ├── exportGenerators.js     # String builders for frontend/backend/watcher/env
│   └── objectPath.js           # Immutable setters/getters + deep merge helper
├── index.css                   # Builder theming + layout styles
└── main.jsx                    # Vite bootstrapper
```

## Configuration schema

The builder works off the `defaultConfig` object in `data/builderSchema.js`. It covers:

- `project`: naming, slug, brand colours, support email
- `product`: deliverable label, amount (USDC major units + EVM minor units), memo, receiver, success redirect, data capture toggles
- `ui`: layout, theme, waiting/success copy, support card and retry toggles
- `flow`: ordered timeline steps plus timer/progress toggles
- `automation`: watcher runtime, cron schedule, session store driver, webhook + notification settings
- `rpc`: network, primary/fallback URLs, priority fee, commitment level
- `secrets`: env var names for session secret, RPC provider key, watcher API token

To seed additional presets, extend the `presets` array in `components/BuilderApp.jsx` with overrides that merge on top of `defaultConfig`.

## What the export snippets include

- **Frontend UI (`@signless/x402-react`)** – Component config covering branding, flow steps, and options (timer, receipt, progress bar).
- **API endpoint (Express)** – `POST /{slug}/invoice` route issuing 402 responses with headers, minor units, expiry, and metadata.
- **Watcher runtime** – `createWatcher` snippet with dynamic session store selection, webhook callback, retries, and RPC wiring.
- **Environment template** – `.env` entries with placeholders for secrets, RPC URLs, store bindings, and webhook targets.

Each snippet is generated from the current form state, so updating the builder automatically refreshes every output tab.

## Deployment

The app builds to a static bundle, so you can host it on any static provider (Cloudflare Pages, Vercel, Netlify, S3, etc.).

```powershell
npm run build
# Upload the contents of the dist/ folder to your hosting provider
```

## Tips

- Use the **preset selector** in the header to jump-start configurations for APIs or creator communities.
- Hit **Reset** to snap back to `defaultConfig` and clear persisted state.
- Download the JSON bundle before sharing with teammates so everyone starts from the same baseline.
- When introducing new configuration fields, update both `builderSchema.js` (for the form) and the corresponding export generator to keep snippets in sync.

For broader SignLess docs and deployment guides, head back to the root `README.md`.
