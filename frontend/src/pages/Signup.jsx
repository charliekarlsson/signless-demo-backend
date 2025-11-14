import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Signup = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    companyName: '',
    supportEmail: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        companyName: form.companyName.trim(),
        supportEmail: form.supportEmail.trim() || undefined,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.data?.error ?? 'Unable to create your workspace.');
    }
  };

  return (
    <div className="auth-form">
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-field">
          <label htmlFor="companyName">Business name</label>
          <input
            id="companyName"
            name="companyName"
            type="text"
            required
            placeholder="Zero Labs"
            value={form.companyName}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">Primary email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@zerolabs.xyz"
            value={form.email}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportEmail">
            Support email <span className="label-optional">optional</span>
          </label>
          <input
            id="supportEmail"
            name="supportEmail"
            type="email"
            placeholder="support@zerolabs.xyz"
            value={form.supportEmail}
            onChange={handleChange}
          />
        </div>
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.password}
            onChange={handleChange}
          />
          <p className="form-helper">Use at least 8 characters to unlock the console.</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating workspace…' : 'Create workspace'}
        </button>
      </form>

      <p className="auth-switch">
        Already onboarded?{' '}
        <Link to="/login" className="auth-link">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Signup;
