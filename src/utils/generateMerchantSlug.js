import prisma from '../lib/prisma.js';
import slugify from './slugify.js';

const makeCandidate = (base, attempt) => {
  if (attempt === 0) return base;
  return `${base}-${attempt}`;
};

const DEFAULT_SLUG_SOURCE = 'merchant';

const createMerchantSlug = async (input) => {
  const trimmed = input?.trim();
  const base = slugify(trimmed || DEFAULT_SLUG_SOURCE) || DEFAULT_SLUG_SOURCE;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = makeCandidate(base, attempt);
    const existing = await prisma.merchant.findUnique({ where: { slug: candidate } });
    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate unique merchant slug');
};

export default createMerchantSlug;
