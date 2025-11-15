# Merchant Dashboard & Onboarding Implementation Plan

## Objectives & Success Criteria
- Deliver a production-ready merchant dashboard that guides new merchants through onboarding, payout configuration, and API adoption.
- Gate sensitive dashboard functionality (checkout builder, API keys, settlements) until mandatory onboarding steps are complete.
- Persist compliance, branding, and payout metadata in Prisma so downstream services (settlement, support) have a single source of truth.
- Expose new REST endpoints that allow the React/Vite frontend to progress merchants through onboarding without manual intervention.

Success is measured by:
1. A new merchant can sign up, complete onboarding, receive an API key, and create a checkout without engineer assistance.
2. Support and ops teams can inspect onboarding state (status, submitted docs, payout wallets) via the backend.
3. Existing merchants automatically migrate to the new schema with `onboardingStatus = "APPROVED"` and retain all data.

## Backend Architecture Changes
### Data Model Extensions (Prisma)
Add the following Prisma constructs:
```prisma
enum OnboardingStatus {
  NOT_STARTED
  COLLECT_PROFILE
  COLLECT_PAYOUT
  COLLECT_COMPLIANCE
  REVIEW
  APPROVED
  REJECTED
}

model Merchant {
  // ...existing fields
  onboardingStatus   OnboardingStatus @default(NOT_STARTED)
  onboardingChecklist Json?            // granular flags per step
  supportEmail        String?          // separate from auth email
  payoutWallets       PayoutWallet[]
  complianceProfile   MerchantCompliance?
  documents           MerchantDocument[]
}

model MerchantCompliance {
  id                 String   @id @default(cuid())
  merchantId         String   @unique
  legalName          String
  countryCode        String   @db.VarChar(2)
  registrationNumber String?
  contactName        String
  contactPhone       String?
  taxId              String?
  kycStatus          String   @default("pending")
  submittedAt        DateTime
  reviewedAt         DateTime?
  reviewerId         String?
  notes              String?
  merchant           Merchant @relation(fields: [merchantId], references: [id])
}

model PayoutWallet {
  id           String   @id @default(cuid())
  merchantId   String
  merchant     Merchant @relation(fields: [merchantId], references: [id])
  network      String   // e.g. base-mainnet
  asset        String   // e.g. USDC
  address      String
  label        String?
  isPrimary    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([merchantId, isPrimary])
}

model MerchantDocument {
  id           String   @id @default(cuid())
  merchantId   String
  merchant     Merchant @relation(fields: [merchantId], references: [id])
  type         String   // e.g. "kyc-id", "w8ben"
  storageKey   String   // bucket/key reference
  status       String   @default("pending")
  uploadedAt   DateTime @default(now())
  processedAt  DateTime?
  checksum     String?
}
```
Migration notes:
- Existing merchants should backfill with `onboardingStatus = APPROVED` and `supportEmail = primaryEmail`.
- Introduce a script that migrates in batches and verifies no duplicate slug unique indexes are impacted.

### Service Layer Enhancements
- `src/utils/`:
  - Add `onboardingChecklist.js` helpers to calculate the next step based on stored flags.
  - Introduce `payoutValidation.js` to validate EVM/USDC wallet addresses (checksum + chain support).
- `src/services/storage.js` (new): abstract uploads to Cloudflare R2/S3 (config via env).
- `src/services/compliance.js` (new): manage compliance state transitions, optional webhook to Zapier/Slack for review notifications.

### API Surface
Create a dedicated router `src/routes/onboarding.js` mounted at `/api/onboarding` with:
- `GET /status`: returns `onboardingStatus`, checklist flags, and missing requirements.
- `PUT /profile`: upserts legal + support contact info (writes to `Merchant` + `MerchantCompliance`).
- `POST /documents`: accepts uploads (multiparty or pre-signed URL request) and records `MerchantDocument` entries.
- `POST /payout-wallets`: create payout wallet; auto-demote existing primary when setting the new one to primary.
- `PATCH /payout-wallets/:id`: update label or mark primary.
- `DELETE /payout-wallets/:id`: cleanup unused wallets.
- `POST /submit`: marks onboarding ready for review; triggers Slack/email notification.
- `POST /approve` & `POST /reject` (guarded by an API key or admin token) to finalize status.

Enhance existing routers:
- `auth.js`: include `supportEmail` during registration; return `onboardingStatus`.
- `merchant.js`: expose payout wallets in `/profile` response, enforce `onboardingStatus === APPROVED` before issuing new API keys (else respond with 409 and remaining tasks).
- `checkouts.js`: gate creation/list endpoints behind a new middleware `requireOnboarded`.

### Middleware & Guards
- Introduce `requireOnboarded` middleware: verifies `req.user.merchant.onboardingStatus === 'APPROVED'` else responds with pending checklist payload.
- Update `requireAuth` to hydrate `onboardingStatus` in `req.user.merchant` for quick checks.

### Background & Ops
- Optional: schedule a daily job (Railway cron) that emails ops with merchants stuck in `REVIEW` > 24h.
- Log structured onboarding events (step entered/completed, documents uploaded) to help support diagnose issues.

## Frontend Architecture Changes
### State & Routing
- Add React Query hooks (`useOnboardingStatus`, `usePayoutWallets`) under `src/hooks/`.
- Extend `AuthContext` to store `merchant.onboardingStatus` and surface `isOnboarded`.
- Introduce `OnboardingLayout` with guarded routes `/onboarding/*` accessible only when status !== APPROVED.
- Update `ProtectedRoute` to redirect non-onboarded users to onboarding wizard before showing dashboard/checkouts/API keys.

### Onboarding Wizard
Create multi-step flow (`src/pages/onboarding/`):
1. **Company profile**: legal name, country, support contact, primary email alignment.
2. **Branding & webhook**: reuse existing form controls, ensure data persists via onboarding endpoints.
3. **Payout wallet**: capture network, asset, address, optional label; mark primary.
4. **Compliance documents**: upload ID/business doc placeholders with progress indicators.
5. **Review & submit**: show summary, checklist, submit for review.

Implementation details:
- Use `react-hook-form` + `zod` for client validation consistent with backend schemas.
- Persist after each step (auto-save) and track completion state via checklist payload.
- Provide inline education (tooltips, doc links) for wallet setup and webhook testing.

### Dashboard Updates
- Replace current profile panel with onboarding completion banner when status !== APPROVED.
- Show payout wallet list + primary indicator once onboarded; allow edits inline.
- In API Keys page, respect gating message if onboarding incomplete.
- Add toast/inline alerts for pending review state.

### Reusable Components
- `ProgressIndicator` showing step completion.
- `PayoutWalletCard` component for listing/editing wallets.
- `DocumentUploader` supporting drag/drop and status display.

### Styling & UX
- Extend `TransactionAuth.css` or create `Onboarding.css` for step layout.
- Ensure accessibility (keyboard nav, aria-live for status messages).

## Integration & Testing Strategy
- **Unit tests**: add Jest/Vitest coverage for helper utilities (`onboardingChecklist`, payout validation).
- **API integration**: use Supertest to cover onboarding endpoints (auth required, validation errors, gating).
- **Frontend tests**: add Vitest/Testing Library specs for onboarding wizard navigation and gating behavior.
- **Manual QA checklist**: exercise new merchant signup, partial onboarding resume, rejection path, existing merchant unaffected.

## Deployment & Rollout
1. Ship database migration via `npx prisma migrate deploy` during maintenance window.
2. Deploy backend with new routes behind feature flag `ENABLE_ONBOARDING_V2` (env-based) to allow staged rollout.
3. Release frontend with onboarding wizard; detect flag to toggle gating in production.
4. Update documentation (`README.md`, `docs/API_INTEGRATION.md`) with new endpoints and onboarding requirements.
5. Train support team on new review flow and create canned responses for pending onboarding.

## Follow-Up Enhancements
- Integrate document review automation (e.g., Persona/Telesign) via async webhooks.
- Add email notifications (SendGrid) for onboarding milestones.
- Build admin dashboard for compliance reviewers.
- Instrument analytics (PostHog or Segment) to measure onboarding drop-off.

## Assumptions
- File storage will leverage Cloudflare R2; credentials exposed via `OBJECT_STORAGE_*` env vars.
- KYC review is manual for first iteration; approvals performed via protected API using ops token.
- Solana support remains out-of-scope until EVM flows are production-stable.
