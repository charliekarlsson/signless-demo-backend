import React, { useMemo } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import LoadingScreen from '../LoadingScreen.jsx';
import { useOnboardingStatus } from '../../hooks/useOnboarding.js';

const STEP_DEFINITIONS = [
  { id: 'profile', label: 'Company profile', to: 'profile' },
  { id: 'payout', label: 'Payout wallet', to: 'payout' },
  { id: 'compliance', label: 'Compliance details', to: 'compliance' },
  { id: 'documents', label: 'Documents', to: 'documents' },
  { id: 'review', label: 'Review & submit', to: 'review' },
];

const resolveStepState = (checklist = {}) => ({
  profile: Boolean(checklist.profile && checklist.branding),
  payout: Boolean(checklist.payout),
  compliance: Boolean(checklist.compliance),
  documents: Boolean(checklist.documents),
  review: Boolean(checklist.submitted || checklist.approved),
});

const StatusBadge = ({ status }) => (
  <span className={`onboarding-status-badge status-${status?.toLowerCase?.() ?? 'unknown'}`}>
    {status ?? 'UNKNOWN'}
  </span>
);

const OnboardingLayout = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useOnboardingStatus({
    refetchOnWindowFocus: false,
  });

  const checklist = data?.checklist ?? {};
  const stepState = useMemo(() => resolveStepState(checklist), [checklist]);

  if (isLoading) {
    return <LoadingScreen message="Preparing your onboarding workspace…" />;
  }

  if (isError) {
    return (
      <div className="onboarding-error">
        <h1>We can’t load onboarding right now</h1>
        <p>{error?.message ?? 'Please retry in a moment.'}</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-layout">
      <aside className="onboarding-sidebar">
        <div className="onboarding-brand">
          <Link to="/">
            <span className="brand-dot" aria-hidden />
            <strong>Signless Merchant Onboarding</strong>
          </Link>
          <StatusBadge status={data.status} />
        </div>

        <nav className="onboarding-nav">
          {STEP_DEFINITIONS.map((step) => (
            <NavLink
              key={step.id}
              to={step.to}
              className={({ isActive }) => `onboarding-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="step-label">{step.label}</span>
              <span className={`step-indicator ${stepState[step.id] ? 'complete' : ''}`}>
                {stepState[step.id] ? 'Complete' : 'Pending'}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="onboarding-sidebar-footer">
          <p>
            Need help? Email <a href={`mailto:${data.merchant?.supportEmail ?? 'support@signless.net'}`}>{data.merchant?.supportEmail ?? 'support@signless.net'}</a>
          </p>
          <p className="refresh-hint">
            {isFetching ? 'Syncing latest updates…' : 'Progress saves instantly. You can resume anytime.'}
          </p>
        </div>
      </aside>

      <main className="onboarding-main">
        <Outlet context={{ onboarding: data, refetchStatus: refetch }} />
      </main>
    </div>
  );
};

export default OnboardingLayout;
