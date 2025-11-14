import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMerchantProfile } from '../hooks/useMerchantProfile.js';
import { api } from '../lib/api.js';
import LoadingScreen from '../components/LoadingScreen.jsx';

const ApiKeys = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useMerchantProfile();
  const [status, setStatus] = useState(null);

  const handleCopy = async (value, message = 'API key copied to clipboard.') => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard unavailable');
      }
      await navigator.clipboard.writeText(value);
      setStatus({ type: 'success', message });
    } catch (copyError) {
      setStatus({
        type: 'info',
        message: 'Copy failed – please copy the key manually.',
      });
    }
  };

  const createKey = useMutation({
    mutationFn: () => api.post('/api/merchant/api-keys'),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      if (response?.apiKey?.key) {
        handleCopy(response.apiKey.key, 'New API key generated and copied.');
      } else {
        setStatus({ type: 'success', message: 'New API key created.' });
      }
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Unable to create API key.' });
    },
  });

  const deleteKey = useMutation({
    mutationFn: (id) => api.del(`/api/merchant/api-keys/${id}`),
    onSuccess: () => {
      setStatus({ type: 'success', message: 'API key revoked.' });
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Unable to revoke API key.' });
    },
  });

  const handleCreateKey = () => {
    setStatus(null);
    createKey.mutate();
  };

  const handleDeleteKey = (id) => {
    setStatus(null);
    deleteKey.mutate(id);
  };

  if (isLoading) {
    return <LoadingScreen message="Fetching API keys…" />;
  }

  if (isError) {
    return (
      <div className="dashboard-error">
        <p>{error?.message ?? 'We were unable to load API keys.'}</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const apiKeys = data?.apiKeys ?? [];

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <h2>API keys</h2>
          <p>Keys authenticate API requests and hosted checkout embeds. Rotate regularly.</p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCreateKey}
          disabled={createKey.isPending}
        >
          {createKey.isPending ? 'Generating…' : 'Generate key'}
        </button>
      </header>

      {status && <p className={`panel-status ${status.type}`}>{status.message}</p>}

      <div className="api-keys-list">
        {apiKeys.length === 0 && <p className="empty-state">No API keys created yet.</p>}
        {apiKeys.map((key) => (
          <article key={key.id} className="api-key-card">
            <div>
              <h3>{key.key}</h3>
              <p>
                Created {new Date(key.createdAt).toLocaleString()}
                {key.lastUsedAt && ` · Last used ${new Date(key.lastUsedAt).toLocaleString()}`}
              </p>
            </div>
            <div className="api-key-actions">
              <button type="button" onClick={() => handleCopy(key.key)}>
                Copy
              </button>
              <button
                type="button"
                className="danger"
                disabled={deleteKey.isPending}
                onClick={() => handleDeleteKey(key.id)}
              >
                Revoke
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default ApiKeys;
