import { buildCheckoutPayloadFromConfig } from './builderCheckout';

const toJsonString = (value, indentation = 2) => JSON.stringify(value, null, indentation);

export const generateFrontendSnippet = (config) => {
  const checkout = buildCheckoutPayloadFromConfig(config);
  const decimals = checkout.decimals ?? 6;

  return `import { CheckoutScreen } from '@signless/x402-react';
import '@signless/x402-react/styles.css';

const checkoutConfig = {
  project: {
    name: ${toJsonString(config.project.name)},
    tagline: ${toJsonString(config.project.tagline)},
    brandColor: ${toJsonString(config.project.brandColor)},
    accentColor: ${toJsonString(config.project.brandAccent)},
    supportEmail: ${toJsonString(config.project.supportEmail)}
  },
  product: {
    label: ${toJsonString(config.product.label)},
    summary: ${toJsonString(config.product.summary)},
    amount: ${toJsonString(checkout.amount)},
    minorUnits: '${checkout.amountMinor}',
    currency: ${toJsonString(checkout.currency)},
    decimals: ${decimals},
    memo: ${toJsonString(config.product.invoiceMemo)},
    network: ${toJsonString(checkout.network)},
    assetAddress: ${toJsonString(checkout.assetAddress)},
    scheme: ${toJsonString(checkout.scheme)},
    collectEmail: ${config.product.collectEmail},
    allowCustomAmount: ${config.product.allowCustomAmount},
    deliverableType: ${toJsonString(config.product.deliverableType)}
  },
  ui: {
    layout: ${toJsonString(config.ui.layout)},
    theme: ${toJsonString(config.ui.theme)},
    successHeadline: ${toJsonString(config.ui.successHeadline)},
    waitingHeadline: ${toJsonString(config.ui.waitingHeadline)},
    waitingCopy: ${toJsonString(config.ui.waitingCopy)},
    successCopy: ${toJsonString(config.ui.successCopy)},
    showSupportCard: ${config.ui.showSupportCard},
    allowRetry: ${config.ui.allowRetry}
  },
  flow: ${toJsonString(config.flow.steps, 2)},
  options: {
    showTimer: ${config.flow.showTimer},
    timerSeconds: ${config.flow.timerSeconds},
    includeReceipt: ${config.flow.includeReceipt},
    showProgressBar: ${config.flow.showProgressBar}
  }
};

export function CheckoutScreenWrapper(props) {
  return <CheckoutScreen config={{ ...checkoutConfig, ...props.config }} />;
}
`; // eslint-disable-line max-len
};

export const generateBackendSnippet = (config) => {
  const checkout = buildCheckoutPayloadFromConfig(config);
  const apiSlug = checkout.slug || 'checkout';

  return `import { Router } from 'express';
import crypto from 'node:crypto';

const router = Router();

router.post('/${apiSlug}/invoice', async (req, res) => {
  const { walletAddress, email } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ error: 'walletAddress is required' });
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + ${config.product.expirySeconds} * 1000;

  const requirement = {
    scheme: ${toJsonString(checkout.scheme)},
    network: ${toJsonString(checkout.network)},
    description: ${toJsonString(config.product.summary || config.product.label)},
    mimeType: 'application/json',
    maxAmountRequired: '${checkout.amountMinor}',
    payTo: process.env.RECEIVER_ADDRESS,
    asset: ${toJsonString(checkout.assetAddress)},
    extra: {
      currency: ${toJsonString(checkout.currency)},
      productLabel: ${toJsonString(config.product.label)},
      successUrl: ${toJsonString(checkout.successUrl)}
    }
  };

  const invoice = {
    sessionId,
    memo: ${toJsonString(config.product.invoiceMemo)},
    amountMinor: '${checkout.amountMinor}',
    receiver: process.env.RECEIVER_ADDRESS,
    expiresAt,
    metadata: {
      product: ${toJsonString(config.product.label)},
      summary: ${toJsonString(config.product.summary)},
      deliverable: ${toJsonString(config.product.deliverableType)},
      emailRequired: ${config.product.collectEmail},
      successRedirect: ${toJsonString(config.product.successRedirect)},
      requirement
    }
  };

  const headers = {
    'x-session-id': sessionId,
    'x402-version': '1',
    'x-payment-requirements': JSON.stringify({ accepts: [requirement] }),
    'x-receiver': invoice.receiver,
    'x-expires-at': String(invoice.expiresAt)
  };

  return res.status(402).set(headers).json(invoice);
});

export default router;
`; // eslint-disable-line max-len
};

const storeImportByType = (store, namespace) => {
  switch (store) {
    case 'redis':
      return {
        imports: "import { redisStore } from '@signless/x402-store-redis';",
        declaration: `const sessionStore = redisStore({\n  url: process.env.REDIS_URL,\n  namespace: '${namespace}'\n});`
      };
    case 'kv':
      return {
        imports: "import { kvStore } from '@signless/x402-store-kv';",
        declaration: `const sessionStore = kvStore({\n  binding: SIGNLESS_SESSIONS,\n  namespace: '${namespace}'\n});`
      };
    case 'd1':
      return {
        imports: "import { d1Store } from '@signless/x402-store-d1';",
        declaration: `const sessionStore = d1Store({\n  binding: env.SIGNLESS_D1,\n  tableName: '${namespace}'\n});`
      };
    default:
      return {
        imports: "import { memoryStore } from '@signless/x402-store-memory';",
        declaration: 'const sessionStore = memoryStore();'
      };
  }
};

export const generateWatcherSnippet = (config) => {
  const checkout = buildCheckoutPayloadFromConfig(config);
  const store = storeImportByType(config.automation.sessionStore, config.automation.sessionStoreNamespace);

  return `import { createWatcher } from '@signless/x402-watcher';
${store.imports}

${store.declaration}

export default createWatcher({
  runtime: ${toJsonString(config.automation.watcherRuntime)},
  network: ${toJsonString(checkout.network)},
  rpcUrl: process.env.RPC_PRIMARY,
  fallbackRpcUrl: process.env.RPC_FALLBACK,
  amountMinor: '${checkout.amountMinor}',
  decimals: ${checkout.decimals},
  currency: ${toJsonString(checkout.currency)},
  receiver: process.env.RECEIVER_ADDRESS,
  assetAddress: ${toJsonString(checkout.assetAddress)},
  memo: ${toJsonString(config.product.invoiceMemo)},
  sessionSecret: process.env.${config.secrets.sessionSecret},
  sessionStore,
  schedule: ${toJsonString(config.automation.watcherSchedule)},
  retries: ${config.automation.retries},
  onVerified: async (payload) => {
    await fetch(${toJsonString(config.automation.webhookUrl)}, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },
  onExpired: async (payload) => {
    console.log('session expired', payload.sessionId);
  }
});
`; // eslint-disable-line max-len
};

export const generateEnvSnippet = (config) => {
  const checkout = buildCheckoutPayloadFromConfig(config);
  const sessionSecretVar = config.secrets.sessionSecret;
  const rpcKeyVar = config.secrets.rpcPrimaryKey;
  const watcherKeyVar = config.secrets.watcherApiKey;

  const lines = [
    `# Project basics`,
    `SIGNLESS_PROJECT_NAME=${config.project.name}`,
    `RECEIVER_ADDRESS=${config.product.receiver}`,
  `ASSET_ADDRESS=${checkout.assetAddress}`,
  `PAYMENT_NETWORK=${checkout.network}`,
  `PAYMENT_CURRENCY=${checkout.currency}`,
    `${sessionSecretVar}=set-a-long-random-session-secret`,
    `${watcherKeyVar}=generate-a-watcher-token`,
    '',
    '# RPC',
    `RPC_NETWORK=${config.rpc.network}`,
    `RPC_PRIMARY=${config.rpc.primary}`,
    `RPC_FALLBACK=${config.rpc.fallback}`,
    `RPC_PRIORITY_FEE_MICROLAMPORTS=${config.rpc.priorityFeeMicrolamports}`,
    `${rpcKeyVar}=your-rpc-provider-key`,
    '',
    '# Watcher runtime',
    `WATCHER_RUNTIME=${config.automation.watcherRuntime}`,
    `WATCHER_SCHEDULE=${config.automation.watcherSchedule}`,
    `SESSION_STORE_DRIVER=${config.automation.sessionStore}`,
    `SESSION_STORE_NAMESPACE=${config.automation.sessionStoreNamespace}`,
    '',
    '# Optional integrations',
    `WEBHOOK_URL=${config.automation.webhookUrl}`,
    `NOTIFY_EMAIL=${config.automation.notifyEmail}`
  ];

  if (config.automation.sessionStore === 'redis') {
    lines.push('REDIS_URL=redis://user:pass@localhost:6379');
  }

  if (config.automation.sessionStore === 'kv') {
    lines.push('SIGNLESS_SESSIONS="<Cloudflare KV namespace binding>"');
  }

  if (config.automation.sessionStore === 'd1') {
    lines.push('SIGNLESS_D1="<Cloudflare D1 binding>"');
  }

  return lines.join('\n');
};
