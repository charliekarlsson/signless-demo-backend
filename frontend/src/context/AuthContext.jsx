import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(undefined);

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  const syncSession = async () => {
    try {
      const data = await api.get('/api/auth/me');
      setUser(data?.user ?? null);
      setMerchant(data?.merchant ?? null);
    } catch (err) {
      setUser(null);
      setMerchant(null);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    syncSession();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/api/auth/login', credentials);
      setUser(data.user);
      setMerchant(data.merchant ?? null);
      return { success: true };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/api/auth/register', payload);
      setUser(data.user);
      setMerchant(data.merchant ?? null);
      return { success: true, apiKey: data.apiKey };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      setError(err);
    } finally {
      setUser(null);
      setMerchant(null);
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      merchant,
      setMerchant,
      loading,
      initializing,
      error,
      login,
      register,
      logout,
      refresh: syncSession,
      isAuthenticated: Boolean(user?.id),
    }),
    [user, merchant, loading, initializing, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export { AuthProvider, useAuth };
