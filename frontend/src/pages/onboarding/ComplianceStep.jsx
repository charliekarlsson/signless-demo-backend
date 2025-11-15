import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUpsertCompliance } from '../../hooks/useOnboarding.js';

const complianceSchema = z.object({
  legalName: z.string().min(2).max(160),
  countryCode: z.string().length(2),
  registrationNumber: z.string().max(64).optional(),
  contactName: z.string().min(2).max(120),
  contactPhone: z.string().max(64).optional(),
  taxId: z.string().max(64).optional(),
});

const ComplianceStep = () => {
  const { onboarding } = useOutletContext();
  const existing = onboarding.compliance ?? {};
  const [status, setStatus] = useState(null);

  const defaultValues = useMemo(() => ({
    legalName: existing.legalName ?? '',
    countryCode: existing.countryCode ?? '',
    registrationNumber: existing.registrationNumber ?? '',
    contactName: existing.contactName ?? '',
    contactPhone: existing.contactPhone ?? '',
    taxId: existing.taxId ?? '',
  }), [existing]);

  const form = useForm({
    resolver: zodResolver(complianceSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const mutation = useUpsertCompliance({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Compliance details saved.' });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Unable to save compliance details.' });
    },
  });

  const handleSubmit = (values) => {
    setStatus(null);
    mutation.mutate({
      ...values,
      countryCode: values.countryCode.toUpperCase(),
    });
  };

  return (
    <div className="onboarding-panel">
      <header className="onboarding-panel-header">
        <div>
          <p className="eyebrow">Step 3</p>
          <h1>Compliance details</h1>
        </div>
        <div className="step-badge">3 / 5</div>
      </header>
      <p className="onboarding-lede">
        Share the legal entity that receives payouts. Our compliance team uses this information to verify ownership and meet regulatory obligations.
      </p>

      <form className="onboarding-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="legalName">Registered legal name</label>
            <input id="legalName" {...form.register('legalName')} />
            {form.formState.errors.legalName && <span className="field-error">{form.formState.errors.legalName.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="countryCode">Country (ISO code)</label>
            <input id="countryCode" placeholder="US" {...form.register('countryCode')} />
            <p className="form-helper">Two-letter country code, e.g. US, CA, SE.</p>
            {form.formState.errors.countryCode && <span className="field-error">{form.formState.errors.countryCode.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="registrationNumber">Registration number</label>
            <input id="registrationNumber" {...form.register('registrationNumber')} />
            <p className="form-helper">Company registry or equivalent.</p>
          </div>
          <div className="form-field">
            <label htmlFor="taxId">Tax ID</label>
            <input id="taxId" {...form.register('taxId')} />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="contactName">Compliance contact</label>
            <input id="contactName" {...form.register('contactName')} />
            {form.formState.errors.contactName && <span className="field-error">{form.formState.errors.contactName.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="contactPhone">Contact phone</label>
            <input id="contactPhone" {...form.register('contactPhone')} />
            <p className="form-helper">Optional, but speeds up review if we have questions.</p>
          </div>
        </div>

        {status && <p className={`panel-status ${status.type}`}>{status.message}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save compliance details'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ComplianceStep;
