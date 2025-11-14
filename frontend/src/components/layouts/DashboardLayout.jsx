import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const DashboardLayout = () => {
  const { merchant, logout } = useAuth();

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
          <NavLink to="/checkouts" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Checkouts
          </NavLink>
          <NavLink to="/builder" className={({ isActive }) => (isActive ? 'active' : undefined)}>
            Checkout Builder
          </NavLink>
          <NavLink to="/api-keys" className={({ isActive }) => (isActive ? 'active' : undefined)}>
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
