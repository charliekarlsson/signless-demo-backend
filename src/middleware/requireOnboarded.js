import prisma from '../lib/prisma.js';
import { ensureChecklist, getIncompleteSteps } from '../utils/onboardingChecklist.js';

const buildResponsePayload = (merchant) => {
  const checklist = ensureChecklist(merchant?.onboardingChecklist);
  const incomplete = getIncompleteSteps(checklist);

  return {
    status: merchant?.onboardingStatus ?? 'NOT_STARTED',
    checklist,
    missingSteps: incomplete,
  };
};

export const requireOnboarded = async (req, res, next) => {
  try {
    if (!req.user?.merchant?.id) {
      return res.status(403).json({ error: 'Merchant context unavailable' });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user.merchant.id },
      select: {
        id: true,
        onboardingStatus: true,
        onboardingChecklist: true,
      },
    });

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant profile not found' });
    }

    if (merchant.onboardingStatus !== 'APPROVED') {
      const payload = buildResponsePayload(merchant);
      return res.status(409).json({
        error: 'Onboarding incomplete',
        ...payload,
      });
    }

    req.merchant = merchant;
    next();
  } catch (error) {
    next(error);
  }
};
