import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import slugify from '../utils/slugify.js';
import { buildPaymentRequirement, buildPaymentRequiredResponse } from '../utils/paymentRequirements.js';

const router = express.Router();

const SUPPORTED_CURRENCIES = ['USDC'];
const SUPPORTED_NETWORKS = ['base-sepolia', 'base-mainnet', 'ethereum-mainnet'];
const SUPPORTED_SCHEMES = ['exact'];

const createCheckoutSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain lowercase alphanumerics and dashes only')
    .min(2)
    .max(48)
    .optional(),
  amount: z
    .string()
    .regex(/^(\d+)(\.\d{1,6})?$/, 'Amount must be a positive number with up to 6 decimals'),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USDC'),
  network: z.enum(SUPPORTED_NETWORKS).default('base-sepolia'),
  scheme: z.enum(SUPPORTED_SCHEMES).default('exact'),
  assetAddress: z.string().min(4),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateCheckoutSchema = createCheckoutSchema.partial();

const toMinorUnits = (amountStr) => {
  const [wholePart, fractionalPart = ''] = amountStr.split('.');
  const paddedFractional = `${fractionalPart}000000`.slice(0, 6);
  const whole = BigInt(wholePart);
  const fraction = BigInt(paddedFractional);
  return whole * 1_000_000n + fraction;
};

const fromMinorUnits = (amountMinor) => {
  const whole = amountMinor / 1_000_000n;
  const fraction = amountMinor % 1_000_000n;
  return `${whole}.${fraction.toString().padStart(6, '0')}`;
};

const serializeCheckout = (checkout) => {
  const amountMinorValue = typeof checkout.amountMinor === 'bigint'
    ? checkout.amountMinor
    : BigInt(checkout.amountMinor);

  return {
  id: checkout.id,
  merchantId: checkout.merchantId,
  name: checkout.name,
  slug: checkout.slug,
  description: checkout.description,
  amount: fromMinorUnits(amountMinorValue),
  amountMinor: amountMinorValue.toString(),
  currency: checkout.currency,
  scheme: checkout.scheme,
  network: checkout.network,
  assetAddress: checkout.assetAddress,
  successUrl: checkout.metadata?.successUrl ?? null,
  cancelUrl: checkout.metadata?.cancelUrl ?? null,
  metadata: checkout.metadata,
  createdAt: checkout.createdAt,
  updatedAt: checkout.updatedAt,
  };
};


router.get('/', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const checkouts = await prisma.checkout.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ checkouts: checkouts.map(serializeCheckout) });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const parsed = createCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid checkout payload',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const slug = data.slug || slugify(data.name);
    const amountMinor = toMinorUnits(data.amount);

    const existing = await prisma.checkout.findFirst({
      where: { merchantId: merchant.id, slug },
    });

    if (existing) {
      return res.status(409).json({ error: 'Checkout slug already in use' });
    }

    const metadata = {
      successUrl: data.successUrl || null,
      cancelUrl: data.cancelUrl || null,
      ...data.metadata,
    };

    const checkout = await prisma.checkout.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        slug,
        description: data.description || null,
        amountMinor,
        currency: data.currency,
        scheme: data.scheme,
        network: data.network,
        assetAddress: data.assetAddress,
        metadata,
      },
    });

    res.status(201).json({ checkout: serializeCheckout(checkout) });
  } catch (error) {
    next(error);
  }
});

router.get('/:checkoutId', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const checkout = await prisma.checkout.findUnique({
      where: { id: req.params.checkoutId },
    });

    if (!checkout || checkout.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    res.json({ checkout: serializeCheckout(checkout) });
  } catch (error) {
    next(error);
  }
});

router.patch('/:checkoutId', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const checkout = await prisma.checkout.findUnique({ where: { id: req.params.checkoutId } });
    if (!checkout || checkout.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    const parsed = updateCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid checkout payload',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const updates = {};

    if (data.name) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.amount) updates.amountMinor = toMinorUnits(data.amount);
    if (data.currency) updates.currency = data.currency;
    if (data.network) updates.network = data.network;
    if (data.scheme) updates.scheme = data.scheme;
    if (data.assetAddress) updates.assetAddress = data.assetAddress;

    if (data.slug) {
      const slug = slugify(data.slug);
      if (!slug) {
        return res.status(400).json({ error: 'Invalid slug' });
      }

      const existing = await prisma.checkout.findFirst({
        where: {
          merchantId: merchant.id,
          slug,
          NOT: { id: checkout.id },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Checkout slug already in use' });
      }

      updates.slug = slug;
    }

    if (data.successUrl || data.cancelUrl || data.metadata) {
      updates.metadata = {
        successUrl: data.successUrl ?? checkout.metadata?.successUrl ?? null,
        cancelUrl: data.cancelUrl ?? checkout.metadata?.cancelUrl ?? null,
        ...(data.metadata || {}),
      };
    }

    const updated = await prisma.checkout.update({
      where: { id: checkout.id },
      data: updates,
    });

    res.json({ checkout: serializeCheckout(updated) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:checkoutId', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const checkout = await prisma.checkout.findUnique({ where: { id: req.params.checkoutId } });
    if (!checkout || checkout.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    await prisma.checkout.delete({ where: { id: checkout.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/:checkoutId/payment-requirement', requireAuth, async (req, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { userId: req.user.id },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    const checkout = await prisma.checkout.findUnique({
      where: { id: req.params.checkoutId },
    });

    if (!checkout || checkout.merchantId !== merchant.id) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    res.json(buildPaymentRequiredResponse(merchant, checkout));
  } catch (error) {
    next(error);
  }
});

export default router;
