import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOutletContext } from 'react-router-dom';
import {
  useCreatePayoutWallet,
  useDeletePayoutWallet,
  useUpdatePayoutWallet,
} from '../../hooks/useOnboarding.js';

const NETWORK_OPTIONS = [
  { value: 'base-sepolia', label: 'Base Sepolia (testnet)' },
  { value: 'base-mainnet', label: 'Base Mainnet' },
  { value: 'ethereum-mainnet', label: 'Ethereum Mainnet' },
];

const DEFAULT_ADDRESS = {
  'base-sepolia': '0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1',
  'base-mainnet': '0x833589fCD6EdB6E08f4fF0d9430f8f3331260eC4',
  'ethereum-mainnet': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48',
};

const payoutSchema = z.object({
  network: z.string().min(2),
  asset: z.literal('USDC'),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  label: z.string().max(64).optional(),
  isPrimary: z.boolean().optional(),
});

const PayoutStep = () => {
  const { onboarding } = useOutletContext();
  const wallets = onboarding.payoutWallets ?? [];
  const [status, setStatus] = useState(null);

  const defaultValues = useMemo(() => ({
    network: wallets[0]?.network ?? 'base-mainnet',
    asset: 'USDC',
    address: '',
    label: '',
    isPrimary: wallets.length === 0,
  }), [wallets]);

  const form = useForm({
    resolver: zodResolver(payoutSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const createWallet = useCreatePayoutWallet({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Payout wallet saved.' });
      form.reset({ ...defaultValues, address: '', label: '' });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Wallet could not be saved.' });
    },
  });

  const updateWallet = useUpdatePayoutWallet({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Wallet updated.' });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Update failed. Try again.' });
    },
  });

  const deleteWallet = useDeletePayoutWallet({
    onSuccess: () => {
      setStatus({ type: 'success', message: 'Wallet removed.' });
    },
    onError: (err) => {
      setStatus({ type: 'error', message: err.data?.error ?? 'Unable to remove wallet.' });
    },
  });

  const handleNetworkChange = (event) => {
    const value = event.target.value;
    form.setValue('network', value);
    form.setValue('asset', 'USDC');
    form.setValue('address', DEFAULT_ADDRESS[value] ?? '');
  };

  const handleSubmit = (values) => {
    setStatus(null);
    createWallet.mutate(values);
  };

  return (
    <div className="onboarding-panel">
      <header className="onboarding-panel-header">
        <div>
          <p className="eyebrow">Step 2</p>
          <h1>Payout wallet</h1>
        </div>
        <div className="step-badge">2 / 5</div>
      </header>
      <p className="onboarding-lede">
        Settlements are streamed to your primary wallet. Add at least one EVM address that can receive USDC. You can rotate or add additional wallets at any time.
      </p>

      <form className="onboarding-form" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="network">Network</label>
            <select id="network" {...form.register('network')} onChange={handleNetworkChange}>
              {NETWORK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="asset">Asset</label>
            <input id="asset" {...form.register('asset')} readOnly />
          </div>
          <div className="form-field">
            <label htmlFor="address">Wallet address</label>
            <input id="address" placeholder="0x…" {...form.register('address')} />
            {form.formState.errors.address && <span className="field-error">{form.formState.errors.address.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="label">Label</label>
            <input id="label" placeholder="Treasury wallet" {...form.register('label')} />
          </div>
        </div>

        <label className="checkbox-field">
          <input type="checkbox" {...form.register('isPrimary')} />
          <span>Make this the primary settlement wallet</span>
        </label>

        {status && <p className={`panel-status ${status.type}`}>{status.message}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={createWallet.isPending}>
            {createWallet.isPending ? 'Saving…' : 'Save wallet'}
          </button>
        </div>
      </form>

      <section className="onboarding-wallets">
        <h2>Registered wallets</h2>
        {wallets.length === 0 ? (
          <p className="onboarding-hint">No wallets yet. Add a payout wallet above to continue.</p>
        ) : (
          <ul>
            {wallets.map((wallet) => (
              <li key={wallet.id} className={wallet.isPrimary ? 'primary' : ''}>
                <div>
                  <h3>{wallet.label || 'Untitled wallet'}</h3>
                  <p>{wallet.address}</p>
                  <small>
                    {wallet.network} • {wallet.asset}
                  </small>
                </div>
                <div className="wallet-actions">
                  {!wallet.isPrimary && (
                    <button
                      type="button"
                      onClick={() => updateWallet.mutate({ walletId: wallet.id, isPrimary: true })}
                      disabled={updateWallet.isPending}
                    >
                      Set primary
                    </button>
                  )}
                  <button
                    type="button"
                    className="danger"
                    onClick={() => deleteWallet.mutate(wallet.id)}
                    disabled={deleteWallet.isPending}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default PayoutStep;
