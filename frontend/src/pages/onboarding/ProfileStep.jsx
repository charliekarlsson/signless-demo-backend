import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOutletContext } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

const colorsSchema = z.object({
  primaryColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
});

const profileSchema = z.object({
  displayName: z.string().min(2).max(128),
  primaryEmail: z.string().email(),
  supportEmail: z.string().email(),
  webhookUrl: z.string().url().or(z.literal('')).optional(),
  primaryColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
});

const toHex = (value, fallback) => {
  if (!value) return fallback;
  return value.startsWith('#') ? value : `#${value}`;
};

const ProfileStep = () => {
  const { onboarding, refetchStatus } = useOutletContext();
  const { merchant } = onboarding;
  const queryClient = useQueryClient();
  const { setMerchant } = useAuth();
  const [statusMessage, setStatusMessage] = useState(null);

  const defaultValues = useMemo(() => ({
    displayName: merchant?.displayName ?? '',
    primaryEmail: merchant?.primaryEmail ?? '',
    supportEmail: merchant?.supportEmail ?? merchant?.primaryEmail ?? '',
    webhookUrl: merchant?.webhookUrl ?? '',
    primaryColor: merchant?.branding?.colors?.primary ?? '#4f7cff',
    accentColor: merchant?.branding?.colors?.accent ?? '#22b8a9',
  }), [merchant]);

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const mutation = useMutation({
    mutationFn: (payload) => api.put('/api/merchant/profile', payload),
    onSuccess: (response) => {
      setStatusMessage({ type: 'success', message: 'Profile updated.' });
      setMerchant(response.merchant);
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      refetchStatus();
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        message: err.data?.error ?? 'Unable to update profile. Check your entries and try again.',
      });
    },
  });

  const handleSubmit = (values) => {
    setStatusMessage(null);
    const payload = {
      displayName: values.displayName,
      primaryEmail: values.primaryEmail,
      supportEmail: values.supportEmail,
      webhookUrl: values.webhookUrl ?? '',
      branding: {
        colors: {
          primary: toHex(values.primaryColor, '#4f7cff'),
          accent: toHex(values.accentColor, '#22b8a9'),
        },
      },
    };
    mutation.mutate(payload);
  };

  return (
    <div className="onboarding-panel">
      <header className="onboarding-panel-header">
        <div>
          <p className="eyebrow">Step 1</p>
          <h1>Company profile & branding</h1>
        </div>
        <div className="step-badge">1 / 5</div>
      </header>
      <p className="onboarding-lede">
        Confirm who we should contact, configure your branded checkout colors, and optionally set a webhook for settlement notifications.
      </p>

      <form className="onboarding-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="displayName">Merchant display name</label>
            <input id="displayName" {...form.register('displayName')} />
            {form.formState.errors.displayName && <span className="field-error">{form.formState.errors.displayName.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="primaryEmail">Primary email</label>
            <input id="primaryEmail" type="email" {...form.register('primaryEmail')} />
            {form.formState.errors.primaryEmail && <span className="field-error">{form.formState.errors.primaryEmail.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="supportEmail">Support email</label>
            <input id="supportEmail" type="email" {...form.register('supportEmail')} />
            <p className="form-helper">Used for payout and compliance follow-up.</p>
            {form.formState.errors.supportEmail && <span className="field-error">{form.formState.errors.supportEmail.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="webhookUrl">Webhook URL</label>
            <input id="webhookUrl" type="url" placeholder="https://settlement.yourdomain.xyz/hooks" {...form.register('webhookUrl')} />
            <p className="form-helper">We’ll POST events whenever payments settle. Leave blank to skip for now.</p>
            {form.formState.errors.webhookUrl && <span className="form-error">{form.formState.errors.webhookUrl.message}</span>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="primaryColor">Primary color</label>
            <input id="primaryColor" type="text" {...form.register('primaryColor')} />
            {form.formState.errors.primaryColor && <span className="field-error">{form.formState.errors.primaryColor.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="accentColor">Accent color</label>
            <input id="accentColor" type="text" {...form.register('accentColor')} />
            {form.formState.errors.accentColor && <span className="field-error">{form.formState.errors.accentColor.message}</span>}
          </div>
          <div className="branding-preview" aria-hidden>
            <span style={{ background: toHex(form.watch('primaryColor'), '#4f7cff') }} />
            <span style={{ background: toHex(form.watch('accentColor'), '#22b8a9') }} />
            <div>
              <strong>Checkout preview</strong>
              <p>Hosted flows inherit your palette instantly.</p>
            </div>
          </div>
        </div>

        {statusMessage && <p className={`panel-status ${statusMessage.type}`}>{statusMessage.message}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileStep;
