import React, { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

const stepDestinations = {
  profile: 'profile',
  branding: 'profile',
  payout: 'payout',
  compliance: 'compliance',
  documents: 'documents',
};

const statusCopy = {
  NOT_STARTED: {
    title: 'Let’s configure your workspace',
    description: 'We’ll capture company info, payout preferences, and compliance docs so your payments can settle automatically.',
  },
  COLLECT_PROFILE: {
    title: 'Complete your company profile',
    description: 'Tell us who you are, where to reach you, and how hosted checkouts should look.',
  },
  COLLECT_PAYOUT: {
    title: 'Add a payout wallet',
    description: 'Register a verified EVM wallet for settlements. We support USDC on Base and Ethereum.',
  },
  COLLECT_COMPLIANCE: {
    title: 'Compliance review pending details',
    description: 'Upload business information and documents so our team can approve settlements.',
  },
  REVIEW: {
    title: 'We’re reviewing your submission',
    description: 'Our compliance team will confirm your details within 24 hours. We’ll email you once approved.',
  },
  APPROVED: {
    title: 'Onboarding complete',
    description: 'You’re cleared to deploy checkouts and issue API keys. Keep details fresh for smooth operations.',
  },
  REJECTED: {
    title: 'Action required',
    description: 'Your submission needs updates. Review comments from our team and resubmit when ready.',
  },
};

const Overview = () => {
  const { onboarding } = useOutletContext();
  const { status, incomplete = [], checklist } = onboarding;

  const hero = statusCopy[status] ?? statusCopy.NOT_STARTED;

  const reminders = useMemo(() => {
    if (status === 'APPROVED') {
      return [];
    }

    return incomplete
      .filter((step) => stepDestinations[step])
      .map((step) => ({
        id: step,
        label: step.replace(/_/g, ' '),
        to: stepDestinations[step],
      }));
  }, [incomplete, status]);

  return (
    <div className="onboarding-panel">
      <header className="onboarding-panel-header">
        <div>
          <p className="eyebrow">Onboarding status</p>
          <h1>{hero.title}</h1>
        </div>
        <span className={`status-chip status-${status?.toLowerCase?.() ?? 'unknown'}`}>{status}</span>
      </header>
      <p className="onboarding-lede">{hero.description}</p>

      <section className="onboarding-summary-grid">
        <article>
          <h2>Progress checklist</h2>
          <ul>
            <li className={checklist.profile && checklist.branding ? 'complete' : 'pending'}>
              Company profile & branding
            </li>
            <li className={checklist.payout ? 'complete' : 'pending'}>Payout wallet</li>
            <li className={checklist.compliance ? 'complete' : 'pending'}>Compliance details</li>
            <li className={checklist.documents ? 'complete' : 'pending'}>Documents uploaded</li>
            <li className={checklist.submitted ? 'complete' : 'pending'}>Submitted for review</li>
          </ul>
        </article>

        <article>
          <h2>Suggested next steps</h2>
          {reminders.length === 0 ? (
            <p className="onboarding-hint">No outstanding items right now. Keep your details up to date if anything changes.</p>
          ) : (
            <ul className="onboarding-actions">
              {reminders.map((item) => (
                <li key={item.id}>
                  <Link to={`../${item.to}`} className="action-link">
                    {`Complete ${item.label}`}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
};

export default Overview;
