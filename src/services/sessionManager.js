// Legacy session manager removed in favour of x402 payment flows.
// This module is intentionally left empty.

export const createAuthRequest = () => {
  throw new Error('Legacy session manager is deprecated. Use x402 payment flows.');
};
