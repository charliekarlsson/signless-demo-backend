export const buildPaymentRequirement = (merchant, checkout) => ({
  scheme: checkout.scheme,
  network: checkout.network,
  resource: `https://${merchant.slug}.x4zero.dev/checkouts/${checkout.slug}`,
  description: checkout.description || checkout.name,
  mimeType: 'application/json',
  maxAmountRequired: checkout.amountMinor.toString(),
  payTo: checkout.assetAddress,
  maxTimeoutSeconds: 60,
  asset: checkout.assetAddress,
  extra: {
    currency: checkout.currency,
    checkoutId: checkout.id,
    successUrl: checkout.metadata?.successUrl || null,
  },
});

export const buildPaymentRequiredResponse = (merchant, checkout) => ({
  x402Version: 1,
  accepts: [buildPaymentRequirement(merchant, checkout)],
});
