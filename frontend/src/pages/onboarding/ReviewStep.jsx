import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSubmitOnboarding } from '../../hooks/useOnboarding.js';

const statusMessages = {
  REVIEW: {
    title: 'Submission received',
    description: 'We’re reviewing your documents. Expect a reply within 24 hours.',
  },
  APPROVED: {
    title: 'You’re live',
    description: 'Onboarding is complete. Explore the dashboard to create checkouts and issue API keys.',
  },
  REJECTED: {
    title: 'Updates required',
    description: 'Review the notes from our team, update the relevant steps, and resubmit for approval.',
  },
};

const ReviewStep = () => {
  const { onboarding, refetchStatus } = useOutletContext();
  const { status, checklist, merchant } = onboarding;
  const [statusMessage, setStatusMessage] = useState(null);
  const submit = useSubmitOnboarding({
    onSuccess: (response) => {
      setStatusMessage({ type: 'success', message: 'Onboarding submitted for review.' });
      refetchStatus();
    },
    onError: (err) => {
      setStatusMessage({
        type: 'error',
        message: err.data?.error ?? 'We need a few more items before review.',
      });
    },
  });

  const meta = statusMessages[status];
  const canSubmit = onboarding.canSubmit && status !== 'REVIEW' && status !== 'APPROVED';

  return (
    <div className="onboarding-panel">
      <header className="onboarding-panel-header">
        <div>
          <p className="eyebrow">Step 5</p>
          <h1>Review & submit</h1>
        </div>
        <div className="step-badge">5 / 5</div>
      </header>
      <p className="onboarding-lede">
        Double-check your information before requesting approval. All items must be complete to submit.
      </p>

      <section className="review-summary">
        <h2>Checklist status</h2>
        <ul>
          <li className={checklist.profile && checklist.branding ? 'complete' : 'pending'}>
            Company profile & branding
          </li>
          <li className={checklist.payout ? 'complete' : 'pending'}>Payout wallet</li>
          <li className={checklist.compliance ? 'complete' : 'pending'}>Compliance details</li>
          <li className={checklist.documents ? 'complete' : 'pending'}>Documents uploaded</li>
        </ul>
      </section>

      <section className="review-card">
        <h2>Current status</h2>
        <p className={`status-chip status-${status?.toLowerCase?.() ?? 'unknown'}`}>{status}</p>
        <p className="review-message">{meta?.description ?? 'Complete each step, then submit for review.'}</p>
        {status === 'REJECTED' && onboarding.compliance?.notes && (
          <p className="review-notes">Reviewer notes: {onboarding.compliance.notes}</p>
        )}
      </section>

      <section className="review-details">
        <h3>Legal entity</h3>
        <dl>
          <div>
            <dt>Display name</dt>
            <dd>{merchant.displayName}</dd>
          </div>
          <div>
            <dt>Primary email</dt>
            <dd>{merchant.primaryEmail}</dd>
          </div>
          <div>
            <dt>Support email</dt>
            <dd>{merchant.supportEmail}</dd>
          </div>
        </dl>
      </section>

      {statusMessage && <p className={`panel-status ${statusMessage.type}`}>{statusMessage.message}</p>}

      <div className="form-actions">
        {canSubmit ? (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setStatusMessage(null);
              submit.mutate();
            }}
            disabled={submit.isPending}
          >
            {submit.isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        ) : (
          <p className="onboarding-hint">
            {status === 'REVIEW'
              ? 'Thanks! We will email you as soon as your account is approved.'
              : status === 'APPROVED'
                ? 'All set. Head to the dashboard to create checkouts.'
                : 'Complete all prior steps to enable submission.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewStep;
