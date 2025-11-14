import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMerchantProfile } from '../hooks/useMerchantProfile.js';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { setMerchant } = useAuth();
  const { data, isLoading, isError, error, refetch } = useMerchantProfile();
  const [form, setForm] = useState({
    displayName: '',
    primaryEmail: '',
    webhookUrl: '',
    primaryColor: '#4f7cff',
    accentColor: '#22b8a9',
  });
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (data?.merchant) {
      const branding = data.merchant.branding ?? {};
      setForm({
        displayName: data.merchant.displayName ?? '',
        primaryEmail: data.merchant.primaryEmail ?? '',
        webhookUrl: data.merchant.webhookUrl ?? '',
        primaryColor: branding.colors?.primary ?? '#4f7cff',
        accentColor: branding.colors?.accent ?? '#22b8a9',
      });
      setMerchant(data.merchant);
    }
  }, [data, setMerchant]);

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
    if (!data?.merchant) return [];
    return [
      {
        label: 'Merchant slug',
        value: data.merchant.slug,
      },
      {
        label: 'Workspace created',
        value: new Date(data.merchant.createdAt).toLocaleDateString(),
      },
      {
        label: 'Webhook status',
        value: data.merchant.webhookUrl ? 'Configured' : 'Not set',
      },
    ];
  }, [data?.merchant]);

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
