import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import createMerchantSlug from '../utils/generateMerchantSlug.js';
import generateApiKey from '../utils/generateApiKey.js';
import {
  issueSession,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} from '../middleware/auth.js';

const router = express.Router();

const registrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(2).max(128),
  supportEmail: z.string().email().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt,
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

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid registration payload',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const slug = await createMerchantSlug(data.companyName);

    const defaultBranding = {
      colors: {
        primary: '#4f7cff',
        accent: '#22b8a9',
      },
      typography: {
        heading: 'Manrope',
        body: 'Manrope',
      },
    };

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        merchant: {
          create: {
            displayName: data.companyName,
            slug,
            primaryEmail: data.supportEmail || email,
            supportEmail: data.supportEmail || email,
            branding: defaultBranding,
            onboardingStatus: 'COLLECT_PROFILE',
            onboardingChecklist: {
              profile: false,
              branding: false,
              payout: false,
              compliance: false,
              documents: false,
              submitted: false,
              approved: false,
            },
          },
        },
      },
      include: {
        merchant: true,
      },
    });

    const apiKeyValue = generateApiKey();
    await prisma.apiKey.create({
      data: {
        merchantId: user.merchant.id,
        key: apiKeyValue,
      },
    });

    const token = issueSession(user.id);
    setSessionCookie(res, token);

    return res.status(201).json({
      user: serializeUser(user),
      merchant: serializeMerchant(user.merchant),
      apiKey: apiKeyValue,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid login payload',
        details: parsed.error.flatten(),
      });
    }

    const data = parsed.data;
    const email = data.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      include: { merchant: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordOk = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = issueSession(user.id);
    setSessionCookie(res, token);

    return res.json({
      user: serializeUser(user),
      merchant: user.merchant ? serializeMerchant(user.merchant) : null,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { merchant: true },
    });

    if (!user) {
      clearSessionCookie(res);
      return res.status(401).json({ error: 'Session expired' });
    }

    res.json({
      user: serializeUser(user),
      merchant: user.merchant ? serializeMerchant(user.merchant) : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;