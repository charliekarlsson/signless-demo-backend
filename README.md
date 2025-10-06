# SignLess Backend - Railway

Backend API for SignLess wallet authentication system.

## Environment Variables (Set in Railway Dashboard)

```
PORT=3000
RECEIVER_WALLET_ADDRESS=5sE9v2bPmHd3axXKXTi31tLmu8YkadLVcxgK76Pi8R3d
VERIFICATION_AMOUNT=0.00001
SESSION_TIMEOUT=300000
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
CORS_ORIGINS=https://your-frontend-domain.pages.dev
```

## Deployment

Railway will automatically:
1. Detect this as a Node.js app
2. Run `npm install`
3. Run `npm start`

Make sure to set all environment variables in the Railway dashboard!
