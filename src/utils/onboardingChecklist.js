export const DEFAULT_CHECKLIST = {
  profile: false,
  branding: false,
  payout: false,
  compliance: false,
  documents: false,
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

export const REQUIRED_STEPS = ['profile', 'branding', 'payout', 'compliance', 'documents'];

export const ensureChecklist = (value) => ({
  ...DEFAULT_CHECKLIST,
  ...(value && typeof value === 'object' ? value : {}),
});

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
    return ONBOARDING_STATUSES.REVIEW;
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

  if (!checklist.compliance || !checklist.documents) {
    return ONBOARDING_STATUSES.COLLECT_COMPLIANCE;
  }

  return ONBOARDING_STATUSES.COLLECT_COMPLIANCE;
};

export const canSubmitForReview = (checklist) => (
  checklist.profile
  && checklist.branding
  && checklist.payout
  && checklist.compliance
  && checklist.documents
  && !checklist.submitted
);

export const markChecklistSteps = (checklist, updates = {}) => {
  const merged = ensureChecklist(checklist);
  Object.entries(updates).forEach(([key, value]) => {
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
