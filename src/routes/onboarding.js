import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import {
  ensureChecklist,
  markChecklistSteps,
  deriveStatusFromChecklist,
  getIncompleteSteps,
  canSubmitForReview,
} from '../utils/onboardingChecklist.js';
import { validatePayoutWallet } from '../utils/payoutValidation.js';

const router = express.Router();

const payoutWalletSchema = z.object({
  network: z.string().min(2),
  asset: z.string().min(2),
  address: z.string().min(10),
  label: z.string().max(64).optional(),
  isPrimary: z.boolean().optional(),
});

const payoutWalletUpdateSchema = z.object({
  label: z.string().max(64).optional(),
  isPrimary: z.boolean().optional(),
});

const complianceSchema = z.object({
  legalName: z.string().min(2).max(160),
  countryCode: z.string().length(2),
  registrationNumber: z.string().max(64).optional(),
  contactName: z.string().min(2).max(120),
  contactPhone: z.string().max(64).optional(),
  taxId: z.string().max(64).optional(),
});

const documentSchema = z.object({
  type: z.string().min(2).max(64),
  storageKey: z.string().min(8),
  status: z.enum(['pending', 'processing', 'approved', 'rejected']).optional(),
  checksum: z.string().max(128).optional(),
});

const reviewSchema = z.object({
  merchantId: z.string().cuid(),
  reviewerId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const serializePayoutWallet = (wallet) => ({
  id: wallet.id,
  network: wallet.network,
  asset: wallet.asset,
  address: wallet.address,
  label: wallet.label,
  isPrimary: wallet.isPrimary,
  createdAt: wallet.createdAt,
  updatedAt: wallet.updatedAt,
});

const serializeDocument = (doc) => ({
  id: doc.id,
  type: doc.type,
  storageKey: doc.storageKey,
  status: doc.status,
  uploadedAt: doc.uploadedAt,
  processedAt: doc.processedAt,
  checksum: doc.checksum,
});

const requireOpsToken = (req, res, next) => {
  const provided = req.headers['x-ops-token'] || req.headers['x-review-token'];
  if (!process.env.ONBOARDING_REVIEW_TOKEN) {
    return res.status(503).json({ error: 'Onboarding review token not configured' });
  }

  if (provided !== process.env.ONBOARDING_REVIEW_TOKEN) {
    return res.status(401).json({ error: 'Invalid review token' });
  }

  return next();
};

const merchantIncludes = {
  payoutWallets: {
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'desc' },
    ],
  },
  complianceProfile: true,
  documents: {
    orderBy: { uploadedAt: 'desc' },
  },
};

const checklistDiffers = (currentChecklist = {}, normalized = {}) => {
  const keys = new Set([
    ...Object.keys(currentChecklist || {}),
    ...Object.keys(normalized || {}),
  ]);

  for (const key of keys) {
    if (currentChecklist?.[key] !== normalized?.[key]) {
      return true;
    }
  }

  return false;
};

const loadMerchantForUser = async (userId) => {
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
    include: merchantIncludes,
  });

  if (!merchant) {
    return null;
  }

  const normalizedChecklist = ensureChecklist(merchant.onboardingChecklist);
  const derivedStatus = deriveStatusFromChecklist(normalizedChecklist, merchant.onboardingStatus);

  if (derivedStatus === 'APPROVED' && !normalizedChecklist.approved) {
    normalizedChecklist.approved = true;
    normalizedChecklist.submitted = false;
  }

  if (
    merchant.onboardingStatus !== derivedStatus ||
    checklistDiffers(merchant.onboardingChecklist, normalizedChecklist)
  ) {
    return prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        onboardingChecklist: normalizedChecklist,
        onboardingStatus: derivedStatus,
      },
      include: merchantIncludes,
    });
  }

  return merchant;
};

const persistChecklist = async (merchant, updates = {}) => {
  const mergedChecklist = markChecklistSteps(ensureChecklist(merchant.onboardingChecklist), updates);
  const nextStatus = merchant.onboardingStatus === 'APPROVED'
    ? 'APPROVED'
    : deriveStatusFromChecklist(mergedChecklist, merchant.onboardingStatus);

  if (nextStatus === 'APPROVED') {
    mergedChecklist.approved = true;
    mergedChecklist.submitted = false;
  }

  return prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      onboardingChecklist: mergedChecklist,
      onboardingStatus: nextStatus,
    },
  });
};

router.get('/status', requireAuth, async (req, res, next) => {
  try {
    const merchant = await loadMerchantForUser(req.user.id);

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const checklist = ensureChecklist(merchant.onboardingChecklist);
    const status = merchant.onboardingStatus;
    const incomplete = getIncompleteSteps(checklist);

    res.json({
      status,
      checklist,
      incomplete,
      canSubmit: canSubmitForReview(checklist),
      merchant: {
        id: merchant.id,
        displayName: merchant.displayName,
        primaryEmail: merchant.primaryEmail,
        supportEmail: merchant.supportEmail,
        webhookUrl: merchant.webhookUrl,
        branding: merchant.branding,
      },
      payoutWallets: merchant.payoutWallets.map(serializePayoutWallet),
      compliance: merchant.complianceProfile,
      documents: merchant.documents.map(serializeDocument),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/payout-wallets', requireAuth, async (req, res, next) => {
  try {
    const parsed = payoutWalletSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const merchant = await loadMerchantForUser(req.user.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const validation = validatePayoutWallet(parsed.data);
    if (!validation.valid) {
      return res.status(422).json({ error: 'Invalid payout wallet', details: validation.errors });
    }

    if (merchant.onboardingStatus === 'REJECTED') {
      return res.status(409).json({ error: 'Onboarding requires review before editing payout wallets.' });
    }

    const hasWallets = merchant.payoutWallets.length > 0;
    const shouldBePrimary = parsed.data.isPrimary ?? !hasWallets;

    if (shouldBePrimary && hasWallets) {
      await prisma.payoutWallet.updateMany({
        where: { merchantId: merchant.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const wallet = await prisma.payoutWallet.create({
      data: {
        merchantId: merchant.id,
        network: parsed.data.network,
        asset: parsed.data.asset,
        address: parsed.data.address,
        label: parsed.data.label ?? null,
        isPrimary: shouldBePrimary,
      },
    });

    const updatedMerchant = await persistChecklist(merchant, { payout: true });

    res.status(201).json({
      wallet: serializePayoutWallet(wallet),
      checklist: updatedMerchant.onboardingChecklist,
      status: updatedMerchant.onboardingStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/payout-wallets/:walletId', requireAuth, async (req, res, next) => {
  try {
    const parsed = payoutWalletUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const merchant = await loadMerchantForUser(req.user.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const wallet = merchant.payoutWallets.find((item) => item.id === req.params.walletId);
    if (!wallet) {
      return res.status(404).json({ error: 'Payout wallet not found' });
    }

    if (parsed.data.isPrimary) {
      await prisma.payoutWallet.updateMany({
        where: { merchantId: merchant.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updatedWallet = await prisma.payoutWallet.update({
      where: { id: wallet.id },
      data: {
        label: parsed.data.label ?? wallet.label,
        isPrimary: parsed.data.isPrimary ?? wallet.isPrimary,
      },
    });

    const updatedChecklistCarrier = await persistChecklist(merchant, { payout: true });

    res.json({
      wallet: serializePayoutWallet(updatedWallet),
      checklist: updatedChecklistCarrier.onboardingChecklist,
      status: updatedChecklistCarrier.onboardingStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/payout-wallets/:walletId', requireAuth, async (req, res, next) => {
  try {
    const merchant = await loadMerchantForUser(req.user.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const wallet = merchant.payoutWallets.find((item) => item.id === req.params.walletId);
    if (!wallet) {
      return res.status(404).json({ error: 'Payout wallet not found' });
    }

    await prisma.payoutWallet.delete({ where: { id: wallet.id } });

    const remainingWallets = merchant.payoutWallets.filter((item) => item.id !== wallet.id);
    const checklistUpdates = remainingWallets.length === 0 ? { payout: false } : { payout: true };
    const updatedMerchant = await persistChecklist(merchant, checklistUpdates);

    res.json({
      success: true,
      checklist: updatedMerchant.onboardingChecklist,
      status: updatedMerchant.onboardingStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/compliance', requireAuth, async (req, res, next) => {
  try {
    const parsed = complianceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const merchant = await loadMerchantForUser(req.user.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const compliance = await prisma.merchantCompliance.upsert({
      where: { merchantId: merchant.id },
      create: {
        merchantId: merchant.id,
        legalName: parsed.data.legalName,
        countryCode: parsed.data.countryCode.toUpperCase(),
        registrationNumber: parsed.data.registrationNumber ?? null,
        contactName: parsed.data.contactName,
        contactPhone: parsed.data.contactPhone ?? null,
        taxId: parsed.data.taxId ?? null,
      },
      update: {
        legalName: parsed.data.legalName,
        countryCode: parsed.data.countryCode.toUpperCase(),
        registrationNumber: parsed.data.registrationNumber ?? null,
        contactName: parsed.data.contactName,
        contactPhone: parsed.data.contactPhone ?? null,
        taxId: parsed.data.taxId ?? null,
      },
    });

    const updatedMerchant = await persistChecklist(merchant, { compliance: true });

    res.json({
      compliance,
      checklist: updatedMerchant.onboardingChecklist,
      status: updatedMerchant.onboardingStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/documents', requireAuth, async (req, res, next) => {
  try {
    const parsed = documentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const merchant = await loadMerchantForUser(req.user.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const document = await prisma.merchantDocument.create({
      data: {
        merchantId: merchant.id,
        type: parsed.data.type,
        storageKey: parsed.data.storageKey,
        status: parsed.data.status ?? 'pending',
        checksum: parsed.data.checksum ?? null,
      },
    });

    const updatedMerchant = await persistChecklist(merchant, { documents: true });

    res.status(201).json({
      document: serializeDocument(document),
      checklist: updatedMerchant.onboardingChecklist,
      status: updatedMerchant.onboardingStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/documents/:documentId', requireAuth, async (req, res, next) => {
  try {
    const merchant = await loadMerchantForUser(req.user.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const document = merchant.documents.find((item) => item.id === req.params.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await prisma.merchantDocument.delete({ where: { id: document.id } });

    const remainingDocs = merchant.documents.filter((item) => item.id !== document.id);
    const updatedMerchant = await persistChecklist(merchant, { documents: remainingDocs.length > 0 });

    res.json({
      success: true,
      checklist: updatedMerchant.onboardingChecklist,
      status: updatedMerchant.onboardingStatus,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/submit', requireAuth, async (req, res, next) => {
  try {
    const merchant = await loadMerchantForUser(req.user.id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const checklist = ensureChecklist(merchant.onboardingChecklist);
    const missingSteps = getIncompleteSteps(checklist);
    if (missingSteps.length > 0) {
      return res.status(409).json({
        error: 'Complete required setup steps before going live.',
        missingSteps,
      });
    }

    const updatedMerchant = await persistChecklist(merchant, {});

    res.json({
      status: updatedMerchant.onboardingStatus,
      checklist: updatedMerchant.onboardingChecklist,
      message: 'Manual review is no longer required. You are ready to accept payments.',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/approve', requireOpsToken, async (req, res, next) => {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const merchant = await prisma.merchant.findUnique({ where: { id: parsed.data.merchantId } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const checklist = ensureChecklist(merchant.onboardingChecklist);
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        onboardingChecklist: {
          ...checklist,
          submitted: true,
          approved: true,
        },
        onboardingStatus: 'APPROVED',
      },
    });

    await prisma.merchantCompliance.updateMany({
      where: { merchantId: merchant.id },
      data: {
        kycStatus: 'approved',
        reviewedAt: new Date(),
        reviewerId: parsed.data.reviewerId ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    res.json({
      status: updatedMerchant.onboardingStatus,
      checklist: updatedMerchant.onboardingChecklist,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reject', requireOpsToken, async (req, res, next) => {
  try {
    const parsed = reviewSchema.extend({ reason: z.string().max(500).optional() }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const merchant = await prisma.merchant.findUnique({ where: { id: parsed.data.merchantId } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const checklist = ensureChecklist(merchant.onboardingChecklist);
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        onboardingChecklist: {
          ...checklist,
          approved: false,
          submitted: false,
        },
        onboardingStatus: 'REJECTED',
      },
    });

    await prisma.merchantCompliance.updateMany({
      where: { merchantId: merchant.id },
      data: {
        kycStatus: 'rejected',
        reviewedAt: new Date(),
        reviewerId: parsed.data.reviewerId ?? null,
        notes: parsed.data.reason ?? parsed.data.notes ?? null,
      },
    });

    res.json({
      status: updatedMerchant.onboardingStatus,
      checklist: updatedMerchant.onboardingChecklist,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
