export const initializeSolanaConnection = async () => {
  throw new Error('Solana support is not yet available. Target EVM/USDC flows.');
};

export const getConnection = () => {
  throw new Error('Solana support is not yet available. Target EVM/USDC flows.');
};

export const checkForIncomingTransaction = async () => ({
  found: false,
  error: 'Solana monitoring not available in current release.',
});

export const verifyTransaction = async () => ({
  verified: false,
  error: 'Solana verification not available in current release.',
});

export const monitorAddress = async () => {
  throw new Error('Solana monitoring not available in current release.');
};

export const getRecentTransactions = async () => {
  throw new Error('Solana monitoring not available in current release.');
};

export const isValidAddress = () => false;
