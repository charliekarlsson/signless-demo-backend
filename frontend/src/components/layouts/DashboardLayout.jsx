import React, { useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { merchant, logout, isOnboarded } = useAuth();

  const handleGatedNav = useCallback((event, gated) => {
    if (!gated || isOnboarded) {
      return;
    }
    event.preventDefault();
    navigate('/onboarding');
  }, [isOnboarded, navigate]);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <strong>X4ZERO</strong>
            <small>{merchant?.displayName ?? 'Merchant Console'}</small>
          </div>
        </div>
        <nav className="dashboard-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Overview
          </NavLink>
          <NavLink
            to="/checkouts"
            className={({ isActive }) => {
              const classes = [];
              if (isActive) classes.push('active');
              if (!isOnboarded) classes.push('disabled');
              return classes.join(' ') || undefined;
            }}
            onClick={(event) => handleGatedNav(event, true)}
            aria-disabled={!isOnboarded}
          >
            Checkouts
          </NavLink>
          <NavLink
            to="/builder"
            className={({ isActive }) => {
              const classes = [];
              if (isActive) classes.push('active');
              if (!isOnboarded) classes.push('disabled');
              return classes.join(' ') || undefined;
            }}
            onClick={(event) => handleGatedNav(event, true)}
            aria-disabled={!isOnboarded}
          >
            Checkout Builder
          </NavLink>
          <NavLink
            to="/api-keys"
            className={({ isActive }) => {
              const classes = [];
              if (isActive) classes.push('active');
              if (!isOnboarded) classes.push('disabled');
              return classes.join(' ') || undefined;
            }}
            onClick={(event) => handleGatedNav(event, true)}
            aria-disabled={!isOnboarded}
          >
            API Keys
          </NavLink>
        </nav>
        <button type="button" className="logout-button" onClick={() => logout()}>
          Log out
        </button>
      </header>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
