export const DEFAULT_CHECKLIST = {
  profile: false,
  branding: false,
  payout: false,
  compliance: true,
  documents: true,
  submitted: false,
  approved: false,
};

export const ONBOARDING_STATUSES = {
  NOT_STARTED: 'NOT_STARTED',
  COLLECT_PROFILE: 'COLLECT_PROFILE',
  COLLECT_PAYOUT: 'COLLECT_PAYOUT',
  COLLECT_COMPLIANCE: 'COLLECT_COMPLIANCE',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const REQUIRED_STEPS = ['profile', 'branding', 'payout'];

export const ensureChecklist = (value) => {
  const merged = {
    ...DEFAULT_CHECKLIST,
    ...(value && typeof value === 'object' ? value : {}),
  };

  // Compliance artifacts are no longer required—normalize to completed
  merged.compliance = true;
  merged.documents = true;
  merged.submitted = false;

  return merged;
};

export const getIncompleteSteps = (checklist) => REQUIRED_STEPS.filter((step) => !checklist[step]);

const isPristine = (checklist) => REQUIRED_STEPS.every((step) => checklist[step] === false) && !checklist.submitted;

export const deriveStatusFromChecklist = (checklist, currentStatus = ONBOARDING_STATUSES.NOT_STARTED) => {
  if (currentStatus === ONBOARDING_STATUSES.REJECTED) {
    return ONBOARDING_STATUSES.REJECTED;
  }

  if (checklist.approved) {
    return ONBOARDING_STATUSES.APPROVED;
  }

  if (checklist.submitted) {
    return ONBOARDING_STATUSES.APPROVED;
  }

  if (isPristine(checklist)) {
    return ONBOARDING_STATUSES.NOT_STARTED;
  }

  if (!checklist.profile || !checklist.branding) {
    return ONBOARDING_STATUSES.COLLECT_PROFILE;
  }

  if (!checklist.payout) {
    return ONBOARDING_STATUSES.COLLECT_PAYOUT;
  }

  return ONBOARDING_STATUSES.APPROVED;
};

export const canSubmitForReview = () => false;

export const markChecklistSteps = (checklist, updates = {}) => {
  const merged = ensureChecklist(checklist);
  const ignoredKeys = new Set(['compliance', 'documents', 'submitted']);
  Object.entries(updates).forEach(([key, value]) => {
    if (ignoredKeys.has(key)) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(merged, key) && typeof value === 'boolean') {
      merged[key] = value;
    }
  });
  return merged;
};

export const buildChecklistSummary = (checklist) => {
  const merged = ensureChecklist(checklist);
  const incomplete = getIncompleteSteps(merged);
  return {
    checklist: merged,
    incomplete,
    canSubmit: canSubmitForReview(merged),
    status: deriveStatusFromChecklist(merged),
  };
};
