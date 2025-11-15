-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM (
    'NOT_STARTED',
    'COLLECT_PROFILE',
    'COLLECT_PAYOUT',
    'COLLECT_COMPLIANCE',
    'REVIEW',
    'APPROVED',
    'REJECTED'
);

-- AlterTable
ALTER TABLE "Merchant"
    ADD COLUMN "supportEmail" TEXT,
    ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN "onboardingChecklist" JSONB;

-- Backfill support email and mark existing merchants as approved
UPDATE "Merchant"
SET
    "supportEmail" = COALESCE("supportEmail", "primaryEmail"),
    "onboardingStatus" = 'APPROVED'
WHERE "onboardingStatus" = 'NOT_STARTED';

-- CreateTable
CREATE TABLE "PayoutWallet" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "label" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayoutWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantCompliance" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "registrationNumber" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "taxId" TEXT,
    "kycStatus" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerId" TEXT,
    "notes" TEXT,
    CONSTRAINT "MerchantCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantDocument" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "checksum" TEXT,
    CONSTRAINT "MerchantDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PayoutWallet_merchantId_isPrimary_idx" ON "PayoutWallet"("merchantId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantCompliance_merchantId_key" ON "MerchantCompliance"("merchantId");

-- AddForeignKey
ALTER TABLE "PayoutWallet"
ADD CONSTRAINT "PayoutWallet_merchantId_fkey"
FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantCompliance"
ADD CONSTRAINT "MerchantCompliance_merchantId_fkey"
FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDocument"
ADD CONSTRAINT "MerchantDocument_merchantId_fkey"
FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
