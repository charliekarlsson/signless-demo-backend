import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCheckouts, useCreateCheckout, useDeleteCheckout, useCheckoutRequirement } from '../hooks/useCheckouts.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

const NETWORK_OPTIONS = [
  {
    value: 'base-sepolia',
    label: 'Base Sepolia (testnet)',
    defaultAsset: '0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1',
  },
  {
    value: 'base-mainnet',
    label: 'Base Mainnet',
    defaultAsset: '0x833589fCD6EdB6E08f4fF0d9430f8f3331260eC4',
  },
  {
    value: 'ethereum-mainnet',
    label: 'Ethereum Mainnet',
    defaultAsset: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48',
  },
];

const CURRENCY_OPTIONS = [{ value: 'USDC', label: 'USDC' }];

const SCHEME_OPTIONS = [{ value: 'exact', label: 'Exact amount' }];

const getDefaultAsset = (network) => NETWORK_OPTIONS.find((item) => item.value === network)?.defaultAsset ?? '';

const STEP_LABELS = {
  profile: 'Company profile',
  branding: 'Branding preferences',
  payout: 'Payout wallet',
  compliance: 'Compliance details',
  documents: 'Verification documents',
};

const initialFormState = {
  name: '',
  description: '',
  slug: '',
  amount: '25.00',
  currency: 'USDC',
  network: NETWORK_OPTIONS[0].value,
  scheme: 'exact',
  assetAddress: getDefaultAsset(NETWORK_OPTIONS[0].value),
  successUrl: '',
  cancelUrl: '',
};

const Checkouts = () => {
  const [form, setForm] = useState(initialFormState);
  const [status, setStatus] = useState(null);
  const [selectedCheckoutId, setSelectedCheckoutId] = useState(null);

  const { data, isLoading, isError, error, refetch } = useCheckouts();
  const createCheckout = useCreateCheckout({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Checkout created successfully.' });
      setForm((prev) => {
        const network = prev.network || initialFormState.network;
        return {
          ...initialFormState,
          network,
          assetAddress: getDefaultAsset(network),
        };
      });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Unable to create checkout.' });
    },
  });
  const deleteCheckout = useDeleteCheckout({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Checkout deleted.' });
      if (selectedCheckoutId) {
        setSelectedCheckoutId(null);
      }
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Unable to delete checkout.' });
    },
  });

  const requirementQuery = useCheckoutRequirement(selectedCheckoutId, {
    enabled: Boolean(selectedCheckoutId),
  });

  useEffect(() => {
    if (!selectedCheckoutId) {
      requirementQuery.remove?.();
    }
  }, [selectedCheckoutId, requirementQuery]);

  const checkouts = data?.checkouts ?? [];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus(null);
  };

  const handleNetworkChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      network: value,
      assetAddress: getDefaultAsset(value),
    }));
    setStatus(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus(null);
    const payload = {
      ...form,
      amount: form.amount.trim(),
      description: form.description.trim() || undefined,
      slug: form.slug.trim() || undefined,
      successUrl: form.successUrl.trim() || undefined,
      cancelUrl: form.cancelUrl.trim() || undefined,
    };
    await createCheckout.mutateAsync(payload);
  };

  const handleDelete = (checkoutId) => {
    setStatus(null);
    deleteCheckout.mutate(checkoutId);
  };

  const requirementJson = useMemo(() => {
    if (!requirementQuery.data) return null;
    return JSON.stringify(requirementQuery.data, null, 2);
  }, [requirementQuery.data]);

  const handleCopy = async (value, message = 'Copied to clipboard.') => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(value);
      setStatus({ type: 'success', message });
    } catch (copyError) {
      setStatus({ type: 'info', message: 'Copy failed – please copy manually.' });
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading your checkouts…" />;
  }

  if (isError && error?.status === 409) {
    return (
      <div className="onboarding-gate">
        <div className="onboarding-gate-content">
          <h1>Complete onboarding to issue checkouts</h1>
          <p>
            We need a verified payout wallet and compliance package before hosted checkouts can collect payments.
            Finish the remaining tasks and we&rsquo;ll unlock this workspace instantly once approved.
          </p>

          {error?.data?.missingSteps?.length > 0 && (
            <div className="onboarding-gate-steps">
              <h2>Outstanding items</h2>
              <ul>
                {error.data.missingSteps.map((step) => (
                  <li key={step}>{STEP_LABELS[step] ?? step}</li>
                ))}
              </ul>
            </div>
          )}

          <Link className="btn-primary" to="/onboarding">
            Continue onboarding
          </Link>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dashboard-error">
        <p>{error?.message ?? 'We were unable to load checkouts.'}</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="checkouts-view">
      <section className="panel">
        <header>
          <div>
            <h2>Create checkout</h2>
            <p>Define pricing, network, and callbacks. We generate x402 payment requirements instantly.</p>
          </div>
        </header>

        {status && <p className={`panel-status ${status.type}`}>{status.message}</p>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Checkout name</label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="slug">
                Slug <span className="label-optional">optional</span>
              </label>
              <input
                id="slug"
                name="slug"
                placeholder="enterprise-plan"
                value={form.slug}
                onChange={handleChange}
              />
              <p className="form-helper">Auto-generated if omitted.</p>
            </div>
            <div className="form-field">
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="currency">Currency</label>
              <select id="currency" name="currency" value={form.currency} onChange={handleChange}>
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="scheme">Scheme</label>
              <select id="scheme" name="scheme" value={form.scheme} onChange={handleChange}>
                {SCHEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="network">Network</label>
              <select id="network" name="network" value={form.network} onChange={handleNetworkChange}>
                {NETWORK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="assetAddress">Asset address</label>
              <input
                id="assetAddress"
                name="assetAddress"
                placeholder="0x..."
                value={form.assetAddress}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field span-two">
              <label htmlFor="description">
                Description <span className="label-optional">optional</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="2"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label htmlFor="successUrl">
                Success URL <span className="label-optional">optional</span>
              </label>
              <input
                id="successUrl"
                name="successUrl"
                type="url"
                placeholder="https://app.yourdomain.xyz/thank-you"
                value={form.successUrl}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label htmlFor="cancelUrl">
                Cancel URL <span className="label-optional">optional</span>
              </label>
              <input
                id="cancelUrl"
                name="cancelUrl"
                type="url"
                placeholder="https://app.yourdomain.xyz/support"
                value={form.cancelUrl}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={createCheckout.isPending}>
            {createCheckout.isPending ? 'Creating…' : 'Create checkout'}
          </button>
        </form>
      </section>

      <section className="panel">
        <header>
          <div>
            <h2>Active checkouts</h2>
            <p>Control distribution, copy the x402 payload, and embed hosted flows.</p>
          </div>
        </header>

        <div className="checkouts-grid">
          {checkouts.length === 0 && <p className="empty-state">No checkouts yet. Create one above to get started.</p>}
          {checkouts.map((checkout) => (
            <article key={checkout.id} className="checkout-card">
              <div className="checkout-card-header">
                <h3>{checkout.name}</h3>
                <span>{checkout.network.replace('-', ' ')}</span>
              </div>
              <p className="checkout-description">{checkout.description || '—'}</p>
              <dl className="checkout-meta">
                <div>
                  <dt>Slug</dt>
                  <dd>{checkout.slug}</dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>
                    {checkout.amount} {checkout.currency}
                  </dd>
                </div>
                <div>
                  <dt>Asset address</dt>
                  <dd>{checkout.assetAddress}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{new Date(checkout.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
              <div className="checkout-actions">
                <button type="button" onClick={() => handleCopy(checkout.slug, 'Slug copied to clipboard.')}>Copy slug</button>
                <button
                  type="button"
                  onClick={() => {
                    setStatus(null);
                    setSelectedCheckoutId((prev) => (prev === checkout.id ? null : checkout.id));
                  }}
                >
                  {selectedCheckoutId === checkout.id ? 'Hide x402 payload' : 'View x402 payload'}
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={deleteCheckout.isPending}
                  onClick={() => handleDelete(checkout.id)}
                >
                  Delete
                </button>
              </div>

              {selectedCheckoutId === checkout.id && (
                <div className="checkout-requirement">
                  {requirementQuery.isLoading ? (
                    <p>Loading requirement…</p>
                  ) : requirementQuery.isError ? (
                    <p>Unable to load requirement: {requirementQuery.error?.message ?? 'Unknown error'}.</p>
                  ) : (
                    <>
                      <pre>{requirementJson ?? 'No payload available.'}</pre>
                      <div className="checkout-requirement-actions">
                        <button
                          type="button"
                          disabled={!requirementJson}
                          onClick={() => requirementJson && handleCopy(requirementJson, 'x402 payload copied.')}
                        >
                          Copy payload
                        </button>
                        <button type="button" onClick={() => setSelectedCheckoutId(null)}>
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Checkouts;
