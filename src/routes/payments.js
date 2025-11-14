import express from 'express';
import prisma from '../lib/prisma.js';
import { buildPaymentRequiredResponse } from '../utils/paymentRequirements.js';

const router = express.Router();

router.get('/supported', (req, res) => {
  res.json({
    kinds: [
      { scheme: 'exact', network: 'base-sepolia' },
      { scheme: 'exact', network: 'base-mainnet' },
      { scheme: 'exact', network: 'ethereum-mainnet' },
    ],
  });
});

router.get('/requirements/:merchantSlug/:checkoutSlug', async (req, res, next) => {
  try {
    const { merchantSlug, checkoutSlug } = req.params;

    const merchant = await prisma.merchant.findUnique({ where: { slug: merchantSlug } });
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const checkout = await prisma.checkout.findFirst({
      where: {
        merchantId: merchant.id,
        slug: checkoutSlug,
      },
    });

    if (!checkout) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    const response = buildPaymentRequiredResponse(merchant, checkout);
    res.status(402).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/resource/:merchantSlug/:checkoutSlug', (req, res) => {
  res.status(501).json({
    error: 'Payment execution not implemented yet. Submit an X-PAYMENT header per x402 spec.',
  });
});

export default router;
