import { DEFAULT_DECIMALS, DEFAULT_SCHEME, getNetworkDefaults } from '../constants/payments.js';

const sanitizeSlug = (value) => {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

export const toMinorUnits = (amount, decimals = DEFAULT_DECIMALS) => {
  if (amount === null || amount === undefined) {
    return 0n;
  }

  const normalized = String(amount).trim();
  if (normalized.length === 0) {
    return 0n;
  }

  const negative = normalized.startsWith('-');
  const sanitized = negative ? normalized.slice(1) : normalized;
  const [wholePartRaw, fractionalRaw = ''] = sanitized.split('.');
  const wholePart = wholePartRaw === '' ? '0' : wholePartRaw;
  const fractionalPadded = `${fractionalRaw}${'0'.repeat(decimals)}`.slice(0, decimals);

  const base = BigInt(10) ** BigInt(decimals);
  const major = BigInt(wholePart);
  const minor = BigInt(fractionalPadded || '0');

  const value = major * base + minor;
  return negative ? -value : value;
};

const formatAmountString = (amount, decimals = DEFAULT_DECIMALS) => {
  if (amount === null || amount === undefined) {
    return '0'.padEnd(decimals + 2, '0');
  }

  const numeric = Number(amount);
  if (Number.isNaN(numeric)) {
    throw new Error('Amount must be a valid number.');
  }

  if (numeric <= 0) {
    throw new Error('Amount must be greater than zero.');
  }

  return numeric.toFixed(decimals);
};

const ensureAssetAddress = (network, assetAddress) => {
  const trimmed = assetAddress?.trim();
  if (trimmed) {
    return trimmed;
  }

  const defaults = getNetworkDefaults(network);
  if (defaults?.defaultAsset) {
    return defaults.defaultAsset;
  }

  throw new Error('No asset contract address set for the selected network.');
};

const resolveSlug = (name, slug) => {
  const candidate = sanitizeSlug(slug || name);
  return candidate || 'checkout';
};

export const buildCheckoutPayloadFromConfig = (config) => {
  const decimals = config.product.decimals ?? DEFAULT_DECIMALS;
  const currency = config.product.currency ?? 'USDC';
  const scheme = config.product.scheme ?? DEFAULT_SCHEME;
  const network = config.product.network ?? 'base-sepolia';
  const amount = formatAmountString(config.product.amount, decimals);
  const amountMinor = toMinorUnits(amount, decimals).toString();
  const assetAddress = ensureAssetAddress(network, config.product.assetAddress);

  const name = config.project.name?.trim();
  if (!name) {
    throw new Error('Provide a checkout name in project basics.');
  }

  const slug = resolveSlug(name, config.project.slug);
  const receiver = config.product.receiver?.trim() || undefined;

  return {
    name,
    description: config.product.summary?.trim() || name,
    slug,
    amount,
    amountMinor,
    currency,
    decimals,
    scheme,
    network,
    assetAddress,
    receiver,
    successUrl: config.product.successRedirect?.trim() || undefined,
    cancelUrl: undefined,
    metadata: {
      source: 'builder',
      builderVersion: '2025-11-14',
      invoiceMemo: config.product.invoiceMemo,
      deliverableType: config.product.deliverableType,
      allowCustomAmount: config.product.allowCustomAmount,
      collectEmail: config.product.collectEmail,
      collectDiscord: config.product.collectDiscord,
      expirySeconds: config.product.expirySeconds,
      supportEmail: config.project.supportEmail,
      ui: config.ui,
      flow: config.flow,
      automation: {
        watcherRuntime: config.automation.watcherRuntime,
        watcherSchedule: config.automation.watcherSchedule,
        sessionStore: config.automation.sessionStore,
        sessionStoreNamespace: config.automation.sessionStoreNamespace,
        webhookUrl: config.automation.webhookUrl,
        notifyEmail: config.automation.notifyEmail,
        retries: config.automation.retries,
      },
      rpc: config.rpc,
      secrets: config.secrets,
      productNetwork: network,
      productCurrency: currency,
      productDecimals: decimals,
    },
  };
};

export const checkoutRequirementFromConfig = (config) => {
  const payload = buildCheckoutPayloadFromConfig(config);

  return {
    scheme: payload.scheme,
    network: payload.network,
    description: payload.description,
    mimeType: 'application/json',
    maxAmountRequired: payload.amountMinor,
    payTo: payload.receiver || 'process.env.RECEIVER_ADDRESS',
    asset: payload.assetAddress,
    extra: {
      currency: payload.currency,
      productLabel: config.product.label,
      successUrl: payload.successUrl,
    },
  };
};
