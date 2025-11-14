# Quick Start Guide

Get SignLess running in 5 minutes.

## Prerequisites

- Node.js 16 or higher
- A Solana wallet with at least 0.001 SOL for rent-exemption
- A Solana RPC endpoint (public mainnet URL provided)

## Step 1: Clone and Install

```bash
git clone https://github.com/yourusername/signless.git
cd signless
npm install
```

## Step 2: Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your wallet address:

```env
RECEIVER_WALLET_ADDRESS=your_wallet_address_here
```

All other defaults are pre-configured for immediate use.

## Step 3: Fund Your Wallet

Transfer at least 0.001 SOL to your receiver wallet address. This is required for the wallet to exist on-chain and accept transactions.

## Step 4: Start the Server

```bash
npm start
```

Server will start on `http://localhost:3000`

## Step 5: Test the API

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{"status":"ok"}
```

## Next Steps

### Integrate with Your Frontend

Add this code to your frontend application:

```javascript
const API_URL = 'http://localhost:3000';

async function startAuth(walletAddress) {
  const response = await fetch(`${API_URL}/api/auth/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  
  const data = await response.json();
  // Display data.expectedAmount and data.receiverAddress to user
  // Then poll /api/auth/verify/:sessionId until verified
}
```

### Deploy to Production

See README.md for deployment instructions for Railway, Render, or Vercel.

### Update CORS

In production, update `CORS_ORIGINS` in `.env` to your domain:

```env
CORS_ORIGINS=https://yourdomain.com
```

## Troubleshooting

### Port Already in Use

Change the port in `.env`:

```env
PORT=3001
```

### RPC Rate Limiting

Consider using a paid RPC provider:
- Helius: https://helius.xyz
- QuickNode: https://quicknode.com
- Alchemy: https://alchemy.com

Update `SOLANA_RPC_URL` in `.env` with your RPC endpoint.

### Authentication Not Working

1. Verify receiver wallet has minimum balance (0.001 SOL)
2. Check transaction appears on Solana Explorer
3. Verify amount sent matches expectedAmount exactly
4. Check server logs for errors

## Support

For additional help, see the full README.md or open an issue on GitHub.
