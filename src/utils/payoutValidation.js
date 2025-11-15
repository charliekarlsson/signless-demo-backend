const SUPPORTED_NETWORKS = ['base-sepolia', 'base-mainnet', 'ethereum-mainnet'];

const SUPPORTED_ASSETS = {
  'base-sepolia': ['USDC'],
  'base-mainnet': ['USDC'],
  'ethereum-mainnet': ['USDC'],
};

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const isValidEvmAddress = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!EVM_ADDRESS_REGEX.test(trimmed)) {
    return false;
  }
  return true;
};

export const validatePayoutWallet = ({ network, asset, address }) => {
  const errors = {};

  if (!network || !SUPPORTED_NETWORKS.includes(network)) {
    errors.network = 'Unsupported network';
  }

  if (!asset || !SUPPORTED_ASSETS[network]?.includes(asset)) {
    errors.asset = 'Unsupported asset';
  }

  if (!isValidEvmAddress(address)) {
    errors.address = 'Invalid wallet address';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const getSupportedNetworks = () => SUPPORTED_NETWORKS;

export const getSupportedAssets = (network) => SUPPORTED_ASSETS[network] ?? [];
