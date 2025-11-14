export const NETWORK_OPTIONS = [
  {
    value: 'base-sepolia',
    label: 'Base Sepolia (testnet)',
    defaultAsset: '0xd886E3cF9d26451aD31f5b7eF0D29006Fc5b76c1',
  },
  {
    value: 'base-mainnet',
    label: 'Base Mainnet',
    defaultAsset: '0x833589fCD6EdB6E08f4fF0d9430f8f3331260eC4',
  },
  {
    value: 'ethereum-mainnet',
    label: 'Ethereum Mainnet',
    defaultAsset: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48',
  },
];

export const CURRENCY_OPTIONS = [
  {
    value: 'USDC',
    label: 'USDC',
    decimals: 6,
  },
];

export const DEFAULT_SCHEME = 'exact';
export const DEFAULT_DECIMALS = 6;

export const getNetworkDefaults = (network) =>
  NETWORK_OPTIONS.find((option) => option.value === network) ?? null;
