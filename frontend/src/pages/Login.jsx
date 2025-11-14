import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await login({ email: form.email.trim(), password: form.password });
      const redirectPath = location.state?.from?.pathname ?? '/';
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.data?.error ?? 'Unable to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="auth-form">
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-field">
          <label htmlFor="email">Work email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.xyz"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
          />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing you in…' : 'Sign in'}
        </button>
      </form>

      <p className="auth-switch">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="auth-link">
          Create one
        </Link>
      </p>
    </div>
  );
};

export default Login;
