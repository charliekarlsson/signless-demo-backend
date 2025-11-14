import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function useMerchantProfile(options = {}) {
  return useQuery({
    queryKey: ['merchant-profile'],
    queryFn: () => api.get('/api/merchant/profile'),
    staleTime: 1000 * 30,
    ...options,
  });
}
