import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export const onboardingQueryKey = ['onboarding-status'];

export function useOnboardingStatus(options = {}) {
  return useQuery({
    queryKey: onboardingQueryKey,
    queryFn: () => api.get('/api/onboarding/status'),
    staleTime: 30_000,
    ...options,
  });
}

export function useCreatePayoutWallet(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/api/onboarding/payout-wallets', payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useUpdatePayoutWallet(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ walletId, ...payload }) => api.patch(`/api/onboarding/payout-wallets/${walletId}`, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useDeletePayoutWallet(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletId) => api.del(`/api/onboarding/payout-wallets/${walletId}`),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useUpsertCompliance(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put('/api/onboarding/compliance', payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useCreateDocument(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/api/onboarding/documents', payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useDeleteDocument(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId) => api.del(`/api/onboarding/documents/${documentId}`),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useSubmitOnboarding(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/api/onboarding/submit'),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: onboardingQueryKey });
      queryClient.invalidateQueries({ queryKey: ['merchant-profile'] });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}
