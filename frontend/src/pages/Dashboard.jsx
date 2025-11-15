import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMerchantProfile } from '../hooks/useMerchantProfile.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

const STEP_LABELS = {
  profile: 'Company profile',
  branding: 'Branding preferences',
  payout: 'Payout wallet',
  compliance: 'Compliance details',
  documents: 'Verification documents',
};

const STATUS_COPY = {
  NOT_STARTED: {
    title: 'Finish onboarding to unlock checkouts and API keys',
    description: 'Complete the onboarding workflow so we can enable settlements and production credentials for your workspace.',
  },
  COLLECT_PROFILE: {
    title: 'Wrap up your company profile',
    description: 'Provide business contact info and checkout branding so customers know who they are paying.',
  },
  COLLECT_PAYOUT: {
    title: 'Add a payout wallet to settle funds',
    description: 'Register an EVM wallet for USDC settlements. We support Base and Ethereum mainnet.',
  },
  COLLECT_COMPLIANCE: {
    title: 'Regulatory review needs a few more details',
    description: 'Submit compliance information and documents so our team can approve your workspace.',
  },
  REVIEW: {
    title: 'Submission received—sit tight ✨',
    description: 'Our compliance team will review your details shortly. We’ll email you the moment you’re approved.',
  },
  REJECTED: {
    title: 'Action required before you can go live',
    description: 'We weren’t able to approve your submission. Update the requested items and resubmit for review.',
  },
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { setMerchant } = useAuth();
  const { data, isLoading, isError, error, refetch } = useMerchantProfile();
  const merchant = data?.merchant;
  const onboardingStatus = merchant?.onboardingStatus ?? 'NOT_STARTED';
  const onboardingChecklist = merchant?.onboardingChecklist ?? {};
  const [form, setForm] = useState({
    displayName: '',
    primaryEmail: '',
    supportEmail: '',
    webhookUrl: '',
    primaryColor: '#4f7cff',
    accentColor: '#22b8a9',
  });
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (merchant) {
      const branding = merchant.branding ?? {};
      setForm({
        displayName: merchant.displayName ?? '',
        primaryEmail: merchant.primaryEmail ?? '',
        supportEmail: merchant.supportEmail ?? merchant.primaryEmail ?? '',
        webhookUrl: merchant.webhookUrl ?? '',
        primaryColor: branding.colors?.primary ?? '#4f7cff',
        accentColor: branding.colors?.accent ?? '#22b8a9',
      });
      setMerchant(merchant);
    }
  }, [merchant, setMerchant]);

  const updateProfile = useMutation({
    mutationFn: (payload) => api.put('/api/merchant/profile', payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      setMerchant(response.merchant);
      setStatusMessage('Profile updated successfully.');
    },
    onError: (err) => {
      setStatusMessage(err.data?.error ?? 'Unable to update merchant profile.');
    },
  });

  const metrics = useMemo(() => {
    if (!merchant) return [];
    return [
      {
        label: 'Merchant slug',
        value: merchant.slug,
      },
      {
        label: 'Workspace created',
        value: new Date(merchant.createdAt).toLocaleDateString(),
      },
      {
        label: 'Webhook status',
        value: merchant.webhookUrl ? 'Configured' : 'Not set',
      },
      {
        label: 'Onboarding status',
        value: onboardingStatus,
      },
    ];
  }, [merchant, onboardingStatus]);

  const incompleteSteps = useMemo(() => (
    Object.entries(STEP_LABELS)
      .filter(([key]) => onboardingChecklist[key] !== true)
      .map(([, label]) => label)
  ), [onboardingChecklist]);

  const statusCopy = STATUS_COPY[onboardingStatus] ?? STATUS_COPY.NOT_STARTED;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatusMessage(null);
  };

  const toHex = (value, fallback) => {
    if (!value) return fallback;
    return value.startsWith('#') ? value : `#${value}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage(null);
    const payload = {
      displayName: form.displayName,
      primaryEmail: form.primaryEmail,
      supportEmail: form.supportEmail,
      webhookUrl: form.webhookUrl || '',
      branding: {
        colors: {
          primary: toHex(form.primaryColor, '#4f7cff'),
          accent: toHex(form.accentColor, '#22b8a9'),
        },
      },
    };
    await updateProfile.mutateAsync(payload);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading your merchant profile…" />;
  }

  if (isError) {
    return (
      <div className="dashboard-error">
        <p>{error?.message ?? 'We were unable to load your merchant profile.'}</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {onboardingStatus !== 'APPROVED' && (
        <div className="panel-callout warning">
          <div>
            <h3>{statusCopy.title}</h3>
            <p>{statusCopy.description}</p>
            {incompleteSteps.length > 0 && (
              <ul>
                {incompleteSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            )}
          </div>
          <Link className="btn-primary" to="/onboarding">Continue onboarding</Link>
        </div>
      )}

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-tile">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="panel">
        <header>
          <div>
            <h2>Merchant profile</h2>
            <p>Keep contact details and webhook configuration up to date for settlement notices.</p>
          </div>
        </header>
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="primaryEmail">Primary email</label>
              <input
                id="primaryEmail"
                name="primaryEmail"
                type="email"
                value={form.primaryEmail}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="supportEmail">Support email</label>
              <input
                id="supportEmail"
                name="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={handleChange}
                required
              />
              <p className="form-helper">Used for payout and compliance coordination.</p>
            </div>
            <div className="form-field">
              <label htmlFor="webhookUrl">Webhook URL</label>
              <input
                id="webhookUrl"
                name="webhookUrl"
                type="url"
                placeholder="https://settlement.yourdomain.xyz/webhooks/x402"
                value={form.webhookUrl}
                onChange={handleChange}
              />
              <p className="form-helper">We&apos;ll POST payment status to this endpoint (optional).</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="primaryColor">Primary color</label>
              <input
                id="primaryColor"
                name="primaryColor"
                type="text"
                value={form.primaryColor}
                onChange={handleChange}
                placeholder="#4f7cff"
              />
            </div>
            <div className="form-field">
              <label htmlFor="accentColor">Accent color</label>
              <input
                id="accentColor"
                name="accentColor"
                type="text"
                value={form.accentColor}
                onChange={handleChange}
                placeholder="#22b8a9"
              />
            </div>
            <div className="branding-preview" aria-hidden>
              <span style={{ background: toHex(form.primaryColor, '#4f7cff') }} />
              <span style={{ background: toHex(form.accentColor, '#22b8a9') }} />
              <div>
                <strong>Checkout preview</strong>
                <p>We style hosted checkouts with these colors.</p>
              </div>
            </div>
          </div>

          {statusMessage && <p className="form-status">{statusMessage}</p>}

          <button type="submit" className="btn-primary" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default Dashboard;
