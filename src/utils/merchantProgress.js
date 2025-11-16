import prisma from '../lib/prisma.js';
import { ensureChecklist, deriveStatusFromChecklist } from './onboardingChecklist.js';

export const merchantRelations = {
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

const checklistDiffers = (currentChecklist = {}, normalizedChecklist = {}) => {
  const keys = new Set([
    ...Object.keys(currentChecklist || {}),
    ...Object.keys(normalizedChecklist || {}),
  ]);

  for (const key of keys) {
    if (currentChecklist?.[key] !== normalizedChecklist?.[key]) {
      return true;
    }
  }

  return false;
};

/**
 * Ensures the merchant's checklist fields are normalized and status auto-advances
 * once profile + payout are complete. When stored data differs, the updated
 * merchant record is persisted and returned with the requested include set.
 */
export const normalizeMerchantProgress = async (merchant, { include } = {}) => {
  if (!merchant) {
    return null;
  }

  const normalizedChecklist = ensureChecklist(merchant.onboardingChecklist);
  let derivedStatus = deriveStatusFromChecklist(normalizedChecklist, merchant.onboardingStatus);

  if (derivedStatus === 'APPROVED' && !normalizedChecklist.approved) {
    normalizedChecklist.approved = true;
    normalizedChecklist.submitted = false;
  }

  const needsChecklistUpdate = checklistDiffers(merchant.onboardingChecklist, normalizedChecklist);
  const needsStatusUpdate = merchant.onboardingStatus !== derivedStatus;

  if (needsChecklistUpdate || needsStatusUpdate) {
    return prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        onboardingChecklist: normalizedChecklist,
        onboardingStatus: derivedStatus,
      },
      include,
    });
  }

  return merchant;
};
