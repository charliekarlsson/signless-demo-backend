import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Link to="/" className="brand-mark">
          <span className="brand-dot" />
          X4ZERO
        </Link>
        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        {title && <h1>{title}</h1>}
      </header>
      <main className="auth-card">{children}</main>
      <footer className="auth-footer">
        <p>© {new Date().getFullYear()} X4ZERO Commerce Infrastructure</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
