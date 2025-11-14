import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function useCheckouts(options = {}) {
  return useQuery({
    queryKey: ['checkouts'],
    queryFn: () => api.get('/api/checkouts'),
    staleTime: 60_000,
    ...options,
  });
}

export function useCreateCheckout(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/api/checkouts', payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useDeleteCheckout(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId) => api.del(`/api/checkouts/${checkoutId}`),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['checkouts'] });
      options?.onSuccess?.(data, variables, context);
    },
    onError: options?.onError,
  });
}

export function useCheckoutRequirement(checkoutId, options = {}) {
  return useQuery({
    queryKey: ['checkout-requirement', checkoutId],
    enabled: Boolean(checkoutId) && options.enabled !== false,
    queryFn: () => api.get(`/api/checkouts/${checkoutId}/payment-requirement`),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
