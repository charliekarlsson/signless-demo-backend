export const defaultConfig = {
  project: {
    name: 'Orbit Checkout',
  tagline: 'Launch trustless onchain payments with X402 micro invoices.',
    slug: 'orbit-checkout',
    brandColor: '#39f6ff',
    brandAccent: '#805bff',
    backgroundStyle: 'nebula',
    supportEmail: 'support@orbit.dev'
  },
  product: {
    label: 'Premium analytics access',
    summary: 'Unlocks the Orbital analytics dashboard with live transaction feeds.',
    amount: '25.000000',
    currency: 'USDC',
    network: 'base-sepolia',
    assetAddress: '0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1',
    decimals: 6,
  scheme: 'exact',
  allowCustomAmount: false,
    deliverableType: 'subscription',
    invoiceMemo: 'orbit-analytics-access',
    receiver: '8kF5ceW3F6o5dB7f4tUh9dcTskc2FEmoFXKNP6PThjXk',
    expirySeconds: 180,
    collectEmail: true,
    collectDiscord: false,
    successRedirect: 'https://app.orbit.dev/dashboard'
  },
  ui: {
    layout: 'split',
    theme: 'nebula-dark',
    successHeadline: 'Access unlocked',
  waitingHeadline: 'Complete the micro-invoice',
  waitingCopy: 'Approve the micro transfer from your wallet to continue.',
    successCopy: 'Session unlocks the moment the watcher confirms the transfer.',
    showSupportCard: true,
    allowRetry: true
  },
  flow: {
    steps: [
      {
        id: 'invoice',
        title: 'Review transparent invoice',
        description: 'Checkout shows memo, receiver, and amount before any wallet prompt.'
      },
      {
        id: 'transfer',
        title: 'Send micro-transaction',
        description: 'User sends the proof-sized payment with zero blind signatures or hidden programs.'
      },
      {
        id: 'unlock',
        title: 'Watcher flips the session',
        description: 'Watcher verifies sender + amount, then toggles access via webhook or store.'
      }
    ],
    showTimer: true,
    timerSeconds: 120,
    includeReceipt: true,
    showProgressBar: true
  },
  automation: {
    watcherRuntime: 'cloudflare-workers',
    watcherSchedule: '*/1 * * * *',
    sessionStore: 'redis',
    sessionStoreNamespace: 'signless_sessions',
    webhookUrl: 'https://api.orbit.dev/signless/webhook',
    notifyEmail: 'ops@orbit.dev',
    retries: 3
  },
  rpc: {
    network: 'mainnet',
    primary: 'https://rpc.your-primary-endpoint.com',
    fallback: 'https://rpc.your-secondary-endpoint.com',
    priorityFeeMicrolamports: 1000,
    commitment: 'confirmed'
  },
  secrets: {
    sessionSecret: 'SIGNLESS_SESSION_SECRET',
    rpcPrimaryKey: 'HELIUS_KEY',
    watcherApiKey: 'WATCHER_API_TOKEN'
  }
};

export const configSections = [
  {
    id: 'project',
    title: 'Project basics',
    description: 'Name, slug, and brand styling for your generated checkout.',
    fields: [
      {
        path: 'project.name',
        label: 'Checkout name',
        type: 'text',
        placeholder: 'Orbit Checkout'
      },
      {
        path: 'project.tagline',
        label: 'One-line positioning',
        type: 'textarea',
        rows: 2,
  placeholder: 'Launch trustless onchain payments with X402 micro invoices.'
      },
      {
        path: 'project.slug',
        label: 'Project slug',
        type: 'text',
        helper: 'Used for generated filenames and API prefixes.'
      },
      {
        path: 'project.brandColor',
        label: 'Primary accent',
        type: 'color'
      },
      {
        path: 'project.brandAccent',
        label: 'Secondary accent',
        type: 'color'
      },
      {
        path: 'project.backgroundStyle',
        label: 'Background style',
        type: 'select',
        options: [
          { label: 'Nebula gradient', value: 'nebula' },
          { label: 'Photon grid', value: 'photon' },
          { label: 'Solid midnight', value: 'midnight' }
        ]
      },
      {
        path: 'project.supportEmail',
        label: 'Support email',
        type: 'text',
        placeholder: 'support@orbit.dev'
      }
    ]
  },
  {
    id: 'product',
    title: 'Product & pricing',
    description: 'Define what you are selling and how much to charge for the micro invoice.',
    fields: [
      {
        path: 'product.label',
        label: 'Deliverable name',
        type: 'text',
        placeholder: 'Premium analytics access'
      },
      {
        path: 'product.summary',
        label: 'Checkout summary',
        type: 'textarea',
        rows: 3,
        placeholder: 'Unlocks the Orbital analytics dashboard with live transaction feeds.'
      },
      {
        path: 'product.deliverableType',
        label: 'Deliverable type',
        type: 'select',
        options: [
          { label: 'Subscription', value: 'subscription' },
          { label: 'One-time digital good', value: 'digital-good' },
          { label: 'Ticket / pass', value: 'ticket' },
          { label: 'API access', value: 'api-access' }
        ]
      },
      {
        path: 'product.amount',
        label: 'Amount (major units)',
        type: 'text',
        placeholder: '25.000000'
      },
      {
        path: 'product.currency',
        label: 'Currency',
        type: 'select',
        options: [
          { label: 'USDC', value: 'USDC' }
        ]
      },
      {
        path: 'product.scheme',
        label: 'Payment scheme',
        type: 'select',
        options: [
          { label: 'Exact amount', value: 'exact' }
        ]
      },
      {
        path: 'product.network',
        label: 'Network',
        type: 'select',
        options: [
          { label: 'Base Sepolia (testnet)', value: 'base-sepolia' },
          { label: 'Base Mainnet', value: 'base-mainnet' },
          { label: 'Ethereum Mainnet', value: 'ethereum-mainnet' }
        ]
      },
      {
        path: 'product.assetAddress',
        label: 'Asset contract address',
        type: 'text',
        placeholder: '0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1'
      },
      {
        path: 'product.allowCustomAmount',
        label: 'Allow custom amount',
        type: 'toggle'
      },
      {
        path: 'product.invoiceMemo',
        label: 'Invoice memo',
        type: 'text',
        placeholder: 'orbit-analytics-access'
      },
      {
        path: 'product.receiver',
        label: 'Receiver address',
        type: 'text',
        placeholder: '0xReceiverAddressOrAccount'
      },
      {
        path: 'product.expirySeconds',
        label: 'Expiry window (seconds)',
        type: 'number',
        step: 30,
        min: 60,
        placeholder: '180'
      },
      {
        path: 'product.collectEmail',
        label: 'Collect email',
        type: 'toggle'
      },
      {
        path: 'product.collectDiscord',
        label: 'Collect Discord handle',
        type: 'toggle'
      },
      {
        path: 'product.successRedirect',
        label: 'Success redirect URL',
        type: 'text',
        placeholder: 'https://app.orbit.dev/dashboard'
      }
    ]
  },
  {
    id: 'ui',
    title: 'Checkout experience',
    description: 'Customize layout, tone, and helper copy for the generated checkout UI.',
    fields: [
      {
        path: 'ui.layout',
        label: 'Layout',
        type: 'select',
        options: [
          { label: 'Split - content + preview', value: 'split' },
          { label: 'Stacked', value: 'stacked' },
          { label: 'Minimal', value: 'minimal' }
        ]
      },
      {
        path: 'ui.theme',
        label: 'Theme',
        type: 'select',
        options: [
          { label: 'Nebula dark', value: 'nebula-dark' },
          { label: 'Glacier light', value: 'glacier-light' },
          { label: 'Terminal', value: 'terminal' }
        ]
      },
      {
        path: 'ui.waitingHeadline',
        label: 'Waiting headline',
        type: 'text'
      },
      {
        path: 'ui.waitingCopy',
        label: 'Waiting copy',
        type: 'textarea',
        rows: 3
      },
      {
        path: 'ui.successHeadline',
        label: 'Success headline',
        type: 'text'
      },
      {
        path: 'ui.successCopy',
        label: 'Success copy',
        type: 'textarea',
        rows: 3
      },
      {
        path: 'ui.showSupportCard',
        label: 'Show support card',
        type: 'toggle'
      },
      {
        path: 'ui.allowRetry',
        label: 'Allow retry button',
        type: 'toggle'
      }
    ]
  },
  {
    id: 'flow',
    title: 'Flow timeline',
    description: 'Describe each step in your X402 journey and configure timers.',
    isCustom: true
  },
  {
    id: 'automation',
    title: 'Automation & watcher',
    description: 'Configure watcher runtime, store, and delivery hooks.',
    fields: [
      {
        path: 'automation.watcherRuntime',
        label: 'Watcher runtime',
        type: 'select',
        options: [
          { label: 'Cloudflare Workers', value: 'cloudflare-workers' },
          { label: 'Node.js cron', value: 'node-cron' },
          { label: 'Railway worker', value: 'railway-worker' }
        ]
      },
      {
        path: 'automation.watcherSchedule',
        label: 'Watcher schedule (cron)',
        type: 'text',
        placeholder: '*/1 * * * *'
      },
      {
        path: 'automation.sessionStore',
        label: 'Session store driver',
        type: 'select',
        options: [
          { label: 'Redis', value: 'redis' },
          { label: 'Cloudflare KV', value: 'kv' },
          { label: 'Cloudflare D1', value: 'd1' },
          { label: 'In-memory (dev)', value: 'memory' }
        ]
      },
      {
        path: 'automation.sessionStoreNamespace',
        label: 'Session store namespace',
        type: 'text',
        placeholder: 'signless_sessions'
      },
      {
        path: 'automation.webhookUrl',
        label: 'Webhook URL on verification',
        type: 'text',
        placeholder: 'https://api.orbit.dev/signless/webhook'
      },
      {
        path: 'automation.notifyEmail',
        label: 'Ops notification email',
        type: 'text',
        placeholder: 'ops@orbit.dev'
      },
      {
        path: 'automation.retries',
        label: 'Watcher retry attempts',
        type: 'number',
        min: 0,
        max: 10,
        step: 1
      }
    ]
  },
  {
    id: 'rpc',
    title: 'Infrastructure',
    description: 'Point the builder at your preferred RPC and network settings.',
    fields: [
      {
        path: 'rpc.network',
        label: 'Network',
        type: 'select',
        options: [
          { label: 'Mainnet', value: 'mainnet' },
          { label: 'Testnet', value: 'testnet' },
          { label: 'Devnet', value: 'devnet' },
          { label: 'Custom', value: 'custom' }
        ]
      },
      {
        path: 'rpc.primary',
        label: 'Primary RPC URL',
        type: 'text',
        placeholder: 'https://rpc.your-primary-endpoint.com'
      },
      {
        path: 'rpc.fallback',
        label: 'Fallback RPC URL',
        type: 'text',
  placeholder: 'https://rpc.your-secondary-endpoint.com'
      },
      {
        path: 'rpc.priorityFeeMicrolamports',
  label: 'Priority fee (base units/microlamports)',
        type: 'number',
        step: 100,
        min: 0
      },
      {
        path: 'rpc.commitment',
        label: 'Commitment level',
        type: 'select',
        options: [
          { label: 'Processed', value: 'processed' },
          { label: 'Confirmed', value: 'confirmed' },
          { label: 'Finalized', value: 'finalized' }
        ]
      }
    ]
  },
  {
    id: 'secrets',
    title: 'Secrets & keys',
    description: 'Name the secrets that will be referenced in generated code.',
    fields: [
      {
        path: 'secrets.sessionSecret',
        label: 'Session secret env var',
        type: 'text',
        placeholder: 'SIGNLESS_SESSION_SECRET'
      },
      {
  path: 'secrets.rpcPrimaryKey',
  label: 'RPC provider key env var',
  type: 'text',
  placeholder: 'RPC_PROVIDER_KEY'
      },
      {
        path: 'secrets.watcherApiKey',
        label: 'Watcher API token env var',
        type: 'text',
        placeholder: 'WATCHER_API_TOKEN'
      }
    ]
  }
];
