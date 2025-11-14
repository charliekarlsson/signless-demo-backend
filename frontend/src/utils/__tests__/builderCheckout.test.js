import { describe, expect, it } from 'vitest';
import {
  buildCheckoutPayloadFromConfig,
  checkoutRequirementFromConfig,
  toMinorUnits,
} from '../builderCheckout.js';

const baseConfig = {
  project: {
    name: 'Test Checkout',
    slug: 'test checkout',
    tagline: 'Testing x402 builder',
    brandColor: '#000000',
    brandAccent: '#ffffff',
    supportEmail: 'ops@example.com',
  },
  product: {
    label: 'Premium test tier',
    summary: 'Unlocks the premium test features.',
    amount: '25',
    currency: 'USDC',
    network: 'base-sepolia',
    assetAddress: '0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1',
    decimals: 6,
    scheme: 'exact',
    allowCustomAmount: false,
    deliverableType: 'subscription',
    invoiceMemo: 'test-invoice',
    receiver: '0x1234567890abcdef1234567890abcdef12345678',
    expirySeconds: 600,
    collectEmail: true,
    collectDiscord: false,
    successRedirect: 'https://example.com/success',
  },
  ui: {
    layout: 'split',
    theme: 'nebula-dark',
    successHeadline: 'Granted',
    waitingHeadline: 'Hold tight',
    waitingCopy: 'Complete the transfer.',
    successCopy: 'Access granted instantly.',
    showSupportCard: true,
    allowRetry: false,
  },
  flow: {
    steps: [
      {
        id: 'one',
        title: 'Review',
        description: 'Review invoice details',
      },
    ],
    showTimer: true,
    timerSeconds: 120,
    includeReceipt: true,
    showProgressBar: false,
  },
  automation: {
    watcherRuntime: 'cloudflare-workers',
    watcherSchedule: '*/1 * * * *',
    sessionStore: 'memory',
    sessionStoreNamespace: 'test_sessions',
    webhookUrl: 'https://example.com/webhook',
    notifyEmail: 'alerts@example.com',
    retries: 1,
  },
  rpc: {
    network: 'mainnet',
    primary: 'https://rpc.example.com',
    fallback: 'https://fallback.example.com',
    priorityFeeMicrolamports: 1000,
    commitment: 'confirmed',
  },
  secrets: {
    sessionSecret: 'SESSION_SECRET',
    rpcPrimaryKey: 'RPC_KEY',
    watcherApiKey: 'WATCHER_TOKEN',
  },
};

const cloneConfig = () => JSON.parse(JSON.stringify(baseConfig));

describe('buildCheckoutPayloadFromConfig', () => {
  it('normalises slug, amount, and minor units', () => {
  const config = cloneConfig();
  config.project.slug = ' Deluxe Checkout ';
  config.product.amount = '42.5';

    const payload = buildCheckoutPayloadFromConfig(config);

    expect(payload.slug).toBe('deluxe-checkout');
    expect(payload.amount).toBe('42.500000');
    expect(payload.amountMinor).toBe(toMinorUnits(payload.amount, payload.decimals).toString());
    expect(payload.currency).toBe('USDC');
    expect(payload.network).toBe(config.product.network);
  });

  it('falls back to network defaults when asset address missing', () => {
    const config = cloneConfig();
    config.product.assetAddress = '';
    config.product.network = 'ethereum-mainnet';

    const payload = buildCheckoutPayloadFromConfig(config);

    expect(payload.assetAddress).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48');
  });

  it('throws when checkout name missing', () => {
  const config = cloneConfig();
  config.project.name = '';

    expect(() => buildCheckoutPayloadFromConfig(config)).toThrow('Provide a checkout name');
  });
});

describe('checkoutRequirementFromConfig', () => {
  it('produces requirement payload with env receiver fallback', () => {
  const config = cloneConfig();
  config.product.receiver = '';

    const requirement = checkoutRequirementFromConfig(config);

    expect(requirement.payTo).toBe('process.env.RECEIVER_ADDRESS');
    expect(requirement.scheme).toBe('exact');
    expect(requirement.maxAmountRequired).toBe('25000000');
    expect(requirement.extra.currency).toBe('USDC');
  });
});
