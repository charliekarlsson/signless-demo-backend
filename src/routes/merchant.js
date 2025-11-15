import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import generateApiKey from '../utils/generateApiKey.js';
import {
  ensureChecklist,
  markChecklistSteps,
  deriveStatusFromChecklist,
  getIncompleteSteps,
} from '../utils/onboardingChecklist.js';

const router = express.Router();

const brandingSchema = z.object({
  colors: z
    .object({
      primary: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
      accent: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
    })
    .optional(),
  typography: z
    .object({
      heading: z.string().max(64),
      body: z.string().max(64),
    })
    .optional(),
});

const profileSchema = z.object({
  displayName: z.string().min(2).max(128),
  primaryEmail: z.string().email(),
  supportEmail: z.string().email().optional(),
  webhookUrl: z
    .string()
    .url()
    .or(z.literal('').transform(() => null))
    .optional(),
  branding: brandingSchema.optional(),
});

const serializeMerchant = (merchant) => ({
  id: merchant.id,
  slug: merchant.slug,
  displayName: merchant.displayName,
  primaryEmail: merchant.primaryEmail,
  supportEmail: merchant.supportEmail,
  branding: merchant.branding,
  webhookUrl: merchant.webhookUrl,
  onboardingStatus: merchant.onboardingStatus,
  onboardingChecklist: merchant.onboardingChecklist,
  createdAt: merchant.createdAt,
  updatedAt: merchant.updatedAt,
});

const serializeApiKey = (apiKey) => ({
  id: apiKey.id,
  key: apiKey.key,
  createdAt: apiKey.createdAt,
  lastUsedAt: apiKey.lastUsedAt,
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

router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
      include: {
        apiKeys: true,
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
      },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    res.json({
      merchant: serializeMerchant(merchant),
      apiKeys: merchant.apiKeys.map(serializeApiKey),
      payoutWallets: merchant.payoutWallets.map(serializePayoutWallet),
      compliance: merchant.complianceProfile,
      documents: merchant.documents,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid profile payload',
        details: parsed.error.flatten(),
      });
    }

    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const updates = parsed.data;
    const mergedBranding = updates.branding
      ? { ...(merchant.branding ?? {}), ...updates.branding }
      : merchant.branding;

    const checklist = ensureChecklist(merchant.onboardingChecklist);
    const updatedChecklist = markChecklistSteps(checklist, {
      profile: true,
      branding: Boolean(mergedBranding),
    });
    const nextStatus = merchant.onboardingStatus === 'APPROVED'
      ? 'APPROVED'
      : deriveStatusFromChecklist(updatedChecklist, merchant.onboardingStatus);

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        displayName: updates.displayName,
        primaryEmail: updates.primaryEmail,
        supportEmail: updates.supportEmail ?? updates.primaryEmail,
        webhookUrl: updates.webhookUrl === '' ? null : updates.webhookUrl,
        branding: mergedBranding,
        onboardingChecklist: updatedChecklist,
        onboardingStatus: nextStatus,
      },
    });

    res.json({ merchant: serializeMerchant(updatedMerchant) });
  } catch (error) {
    next(error);
  }
});

router.post('/api-keys', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    if (merchant.onboardingStatus !== 'APPROVED') {
      const checklist = ensureChecklist(merchant.onboardingChecklist);
      return res.status(409).json({
        error: 'Complete onboarding before generating API keys.',
        onboardingStatus: merchant.onboardingStatus,
        missingSteps: getIncompleteSteps(checklist),
      });
    }

    const apiKeyValue = generateApiKey();
    const key = await prisma.apiKey.create({
      data: {
        merchantId: merchant.id,
        key: apiKeyValue,
      },
    });

    res.status(201).json({ apiKey: serializeApiKey({ ...key, key: apiKeyValue }) });
  } catch (error) {
    next(error);
  }
});

router.delete('/api-keys/:id', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const { id } = req.params;

    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key || key.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.apiKey.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
