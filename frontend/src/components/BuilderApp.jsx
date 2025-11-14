import React, { useEffect, useMemo, useState } from 'react';
import { defaultConfig, configSections } from '../data/builderSchema';
import { setValueAtPath, mergeDeep } from '../utils/objectPath';
import {
  generateBackendSnippet,
  generateEnvSnippet,
  generateFrontendSnippet,
  generateWatcherSnippet
} from '../utils/exportGenerators';
import FlowEditor from './FlowEditor';
import CodePanel from './CodePanel';
import PreviewPanel from './PreviewPanel';
import SectionFields from './SectionFields';

const formatTokenAmount = (value, currency = 'USDC') => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return `0.000000 ${currency}`;
  }
  return `${numeric.toFixed(6)} ${currency}`;
};

const toMinorUnits = (amount, decimals = 6) => {
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

const formatLabel = (value) => {
  if (!value) return '—';
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const presets = [
  {
    id: 'digital-pass',
    label: 'Digital pass',
    description: 'Time-boxed access for communities and creator memberships.',
    override: {
      project: {
        name: 'Creator Pass',
        tagline: 'Unlock exclusive drops and mentorship sessions in minutes.',
        slug: 'creator-pass',
        brandColor: '#ff47b5',
        brandAccent: '#39f6ff'
      },
      product: {
        label: 'VIP access pass',
        summary: 'Grants 30 days of gated content and live workshop replays.',
        amount: '15.000000',
        currency: 'USDC',
        network: 'base-mainnet',
        assetAddress: '0x833589fCD6EdB6E08f4fF0d9430f8f3331260eC4',
        invoiceMemo: 'creator-pass-30d',
        deliverableType: 'digital-good',
        receiver: '6kU9n9C1fhXmN3MDMG1xmNCkSuPcJHFWeT9nQX5W6SPk',
        expirySeconds: 300,
        successRedirect: 'https://creatorsuite.xyz/unlocked'
      },
      flow: {
        timerSeconds: 180
      },
      automation: {
        sessionStoreNamespace: 'creator_pass_sessions',
        webhookUrl: 'https://creatorsuite.xyz/api/signless/verified'
      }
    }
  },
  {
    id: 'api-tier',
    label: 'API tier checkout',
    description: 'Monetise API access with automated session unlocks.',
    override: {
      project: {
        name: 'Orbital API Access',
        tagline: 'Grant API keys only to wallets that prove ownership.',
        slug: 'orbital-api'
      },
      product: {
        label: 'Pro API tier',
        summary: 'Unlocks 1M requests/day for the Orbital analytics API.',
        amount: '349.000000',
        currency: 'USDC',
        network: 'base-mainnet',
        assetAddress: '0x833589fCD6EdB6E08f4fF0d9430f8f3331260eC4',
        deliverableType: 'api-access',
        invoiceMemo: 'orbital-api-pro',
        collectEmail: true,
        collectDiscord: true,
        successRedirect: 'https://api.orbit.dev/console'
      },
      automation: {
        webhookUrl: 'https://api.orbit.dev/signless/webhook',
        notifyEmail: 'api-ops@orbit.dev'
      },
      rpc: {
        network: 'mainnet-beta'
      }
    }
  }
];

const BuilderApp = () => {
  const [config, setConfig] = useState(defaultConfig);
  const [activeSection, setActiveSection] = useState(configSections[0]?.id ?? 'project');
  const [hasChanges, setHasChanges] = useState(false);
  const presetSelectId = 'builder-preset-select';

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('signless-builder-config');
      if (!stored) return;
      const parsed = JSON.parse(stored);

      const migrated = { ...parsed };
      if (migrated?.product) {
        if (migrated.product.amountSol && !migrated.product.amount) {
          migrated.product.amount = Number(migrated.product.amountSol).toFixed(6);
          delete migrated.product.amountSol;
        }
        if (!migrated.product.currency) {
          migrated.product.currency = defaultConfig.product.currency;
        }
        if (!migrated.product.network) {
          migrated.product.network = defaultConfig.product.network;
        }
        if (!migrated.product.assetAddress) {
          migrated.product.assetAddress = defaultConfig.product.assetAddress;
        }
        if (!migrated.product.decimals) {
          migrated.product.decimals = defaultConfig.product.decimals;
        }
      }

      const merged = mergeDeep(defaultConfig, migrated);
      setConfig(merged);
      setHasChanges(true);
    } catch (error) {
      console.warn('Unable to load stored builder config', error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('signless-builder-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Unable to persist builder config', error);
    }
  }, [config]);

  const updateConfig = (path, value) => {
    setConfig((prev) => {
      const next = setValueAtPath(prev, path, value);
      return next;
    });
    setHasChanges(true);
  };

  const loadPreset = (presetId) => {
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    const merged = mergeDeep(defaultConfig, preset.override);
    setConfig(merged);
    setHasChanges(true);
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    setHasChanges(false);
    try {
      window.localStorage.removeItem('signless-builder-config');
    } catch (error) {
      console.warn('Unable to clear stored config', error);
    }
  };

  const downloadConfig = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${config.project.slug || 'signless-checkout'}-builder.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const minorUnits = useMemo(
    () => toMinorUnits(config.product.amount, config.product.decimals ?? 6),
    [config.product.amount, config.product.decimals],
  );

  const codeSnippets = useMemo(
    () => ({
      frontend: generateFrontendSnippet(config),
      backend: generateBackendSnippet(config),
      watcher: generateWatcherSnippet(config),
      env: generateEnvSnippet(config)
    }),
    [config]
  );

  return (
    <div
      className="builder-shell"
      style={{ '--accent-color': config.project.brandColor, '--accent-accent': config.project.brandAccent }}
    >
      <section className="builder-header">
        <div className="builder-header-inner">
          <div className="builder-intro">
            <span className="section-tag">[ X402 checkout builder ]</span>
            <h1 className="builder-title">Craft {config.project.name || 'your onchain checkout'}</h1>
            <p className="builder-lede">
              {config.project.tagline ||
                'Compose the entire flow in minutes—UI, invoices, watcher, and deploy scripts ready to ship.'}
            </p>
            <div className="builder-actions">
              <button type="button" className="btn-primary" onClick={downloadConfig}>
                Download config JSON
              </button>
              <button type="button" className="btn-secondary" onClick={resetConfig}>
                Reset workspace
              </button>
              <label className="preset-picker" htmlFor={presetSelectId}>
                <span>Preset</span>
                <select
                  id={presetSelectId}
                  onChange={(event) => loadPreset(event.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose preset
                  </option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <aside className="builder-metrics" aria-label="Current checkout metrics">
            <article className="metric-card" data-variant="cyan">
              <span className="metric-label">Invoice amount</span>
              <strong>{formatTokenAmount(config.product.amount, config.product.currency)}</strong>
              <small>{minorUnits.toLocaleString()} base units</small>
            </article>
            <article className="metric-card" data-variant="violet">
              <span className="metric-label">Deliverable type</span>
              <strong>{formatLabel(config.product.deliverableType)}</strong>
              <small>Receipt: {config.flow.includeReceipt ? 'Enabled' : 'Disabled'}</small>
            </article>
            <article className="metric-card" data-variant="slate">
              <span className="metric-label">Watcher runtime</span>
              <strong>{formatLabel(config.automation.watcherRuntime)}</strong>
              <small>{formatLabel(config.automation.sessionStore)} store</small>
            </article>
          </aside>
        </div>
        {hasChanges && (
          <div className="builder-alert" role="status">
            <span className="alert-dot" aria-hidden="true" />
            Unsaved edits stored locally. Download or reset whenever you’re ready.
          </div>
        )}
      </section>

      <main className="builder-layout">
        <aside className="config-column">
          <nav className="section-nav" aria-label="Configuration sections">
            {configSections.map((section) => (
              <button
                type="button"
                key={section.id}
                className={section.id === activeSection ? 'active' : ''}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.title}</span>
                <small>{section.description}</small>
              </button>
            ))}
          </nav>
          <section className="config-details" aria-live="polite">
            {configSections.map((section) => {
              if (section.id !== activeSection) return null;

              if (section.isCustom && section.id === 'flow') {
                return (
                  <FlowEditor
                    key={section.id}
                    flow={config.flow}
                    onChange={(nextFlow) => updateConfig('flow', nextFlow)}
                  />
                );
              }

              return (
                <SectionFields
                  key={section.id}
                  section={section}
                  config={config}
                  onChange={updateConfig}
                />
              );
            })}
          </section>
        </aside>

        <section className="output-column" aria-label="Preview and exports">
          <PreviewPanel config={config} minorUnits={minorUnits} dirty={hasChanges} />
          <CodePanel snippets={codeSnippets} />
        </section>
      </main>

      <footer className="builder-footer">
        <span>
          Need a starting point? Load a preset, tweak colors, and export the snippets straight into your repo.
        </span>
        <span>MIT licensed · No blind signing · Proof-of-wallet in seconds</span>
      </footer>
    </div>
  );
};

export default BuilderApp;
