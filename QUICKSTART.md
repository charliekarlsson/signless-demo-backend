# 🚀 SignLess Quick Start Guide

Get your SignLess authentication system running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ A Solana wallet address (for receiving transactions)
- ✅ Basic terminal/PowerShell knowledge

## Step 1: Setup (2 minutes)

```powershell
# Clone or navigate to project
cd signless

# Run automated setup
.\setup.ps1

# This installs all dependencies for both backend and frontend
```

## Step 2: Configure (1 minute)

Edit `.env` file:

```env
# Required: Your Solana wallet where users will send verification transactions
RECEIVER_WALLET_ADDRESS=YOUR_WALLET_ADDRESS_HERE

# Optional: Use devnet for testing (recommended)
SOLANA_RPC_URL=https://api.devnet.solana.com

# Optional: Change verification amount
VERIFICATION_AMOUNT=0.00001
```

## Step 3: Start Backend (30 seconds)

```powershell
# In project root
npm start
```

You should see:
```
🚀 Solana Transaction Auth API running on port 3000
📡 Network: https://api.devnet.solana.com
💼 Receiver wallet: YourWalletAddress...
```

## Step 4: Start Frontend (30 seconds)

Open a **new terminal**:

```powershell
cd frontend
npm run dev
```

You should see:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
```

## Step 5: Test (1 minute)

1. Open http://localhost:5173 in your browser
2. Click "Connect Wallet" (you'll need Phantom or Solflare installed)
3. Click "Start" to initiate authentication
4. Approve the transaction in your wallet
5. ✅ Success! You're authenticated

## Quick Commands

```powershell
# Backend
npm start                    # Start server
npm run dev                  # Start with auto-reload

# Frontend
cd frontend
npm run dev                  # Start dev server
npm run build                # Build for production

# Testing
curl http://localhost:3000/health  # Test backend
```

## Common Issues

### "RECEIVER_WALLET_ADDRESS not configured"
➡️ **Fix**: Edit `.env` and add your wallet address

### "Connection refused"
➡️ **Fix**: Make sure backend is running on port 3000

### "Wallet not found"
➡️ **Fix**: Install Phantom or Solflare browser extension

### "Transaction failed"
➡️ **Fix**: Make sure you're using devnet and have devnet SOL
   - Get devnet SOL: https://solfaucet.com/

## What's Next?

### For Testing
- Get devnet SOL from [solfaucet.com](https://solfaucet.com/)
- Test with different wallet addresses
- Try the full authentication flow

### For Development
- Read `docs/API_INTEGRATION.md` for integration guide
- Check `examples/integration.js` for code examples
- Review `docs/ARCHITECTURE.md` for system design

### For Production
- Read `docs/DEPLOYMENT.md` for deployment guide
- Switch to mainnet RPC URL
- Set up monitoring and logging
- Configure production wallet

## API Quick Reference

**Base URL**: `http://localhost:3000`

### Initiate Authentication
```bash
POST /api/auth/initiate
Body: { "walletAddress": "SolanaAddressHere" }
```

### Verify Transaction
```bash
POST /api/auth/verify
Body: { 
  "sessionId": "uuid-here",
  "signature": "tx-signature-here"
}
```

### Check Status
```bash
GET /api/auth/status/:sessionId
```

### Logout
```bash
POST /api/auth/logout
Body: { "sessionId": "uuid-here" }
```

## JavaScript Integration

```javascript
// 1. Initiate
const response = await fetch('http://localhost:3000/api/auth/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: 'YOUR_WALLET' })
});
const data = await response.json();

// 2. User sends transaction (use wallet adapter)

// 3. Verify
const result = await fetch('http://localhost:3000/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    sessionId: data.sessionId,
    signature: transactionSignature
  })
});
```

## React Integration

```jsx
import { useWallet, useConnection } from '@solana/wallet-adapter-react';

function MyAuth() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const authenticate = async () => {
    // Your auth logic here
    // See frontend/src/components/TransactionAuth.jsx for full example
  };

  return <button onClick={authenticate}>Sign In</button>;
}
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `RECEIVER_WALLET_ADDRESS` | **Yes** | - | Your wallet |
| `SOLANA_RPC_URL` | No | devnet | RPC endpoint |
| `VERIFICATION_AMOUNT` | No | 0.00001 | Amount in SOL (≈$0.002) |
| `SESSION_EXPIRY_MINUTES` | No | 15 | Session duration |
| `CORS_ORIGINS` | No | * | Allowed origins |

## File Structure

```
signless/
├── src/              # Backend source
├── frontend/         # React frontend
├── docs/            # Documentation
├── examples/        # Code examples
├── .env            # Your config (create from .env.example)
└── README.md       # Full documentation
```

## Testing Checklist

- [ ] Backend health check works
- [ ] Frontend loads without errors
- [ ] Can connect wallet
- [ ] Can initiate authentication
- [ ] Transaction sends successfully
- [ ] Verification completes
- [ ] Session persists
- [ ] Can logout

## Getting Help

1. **Check the docs**: `README.md` has detailed information
2. **Review examples**: `examples/integration.js` has code samples
3. **Common issues**: See "Common Issues" section above
4. **GitHub Issues**: Report bugs or ask questions

## Useful Links

- **Solana Explorer (Devnet)**: https://explorer.solana.com/?cluster=devnet
- **Get Devnet SOL**: https://solfaucet.com/
- **Phantom Wallet**: https://phantom.app/
- **Solana Docs**: https://docs.solana.com/

## Development Tips

```powershell
# View backend logs
npm start

# View frontend logs
cd frontend; npm run dev

# Test API endpoint
curl http://localhost:3000/health

# Build frontend for production
cd frontend; npm run build

# Check for errors
npm run test  # (if tests configured)
```

## Production Checklist

Before deploying:

- [ ] Change to mainnet RPC
- [ ] Update CORS_ORIGINS
- [ ] Set up monitoring
- [ ] Enable HTTPS
- [ ] Test thoroughly
- [ ] Set up backups
- [ ] Configure logging

## Quick Deploy (Railway)

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

## Performance Tips

- Use a reliable RPC provider (Alchemy, QuickNode)
- Implement Redis for session storage
- Add rate limiting
- Monitor API response times
- Cache blockchain queries

## Security Checklist

- [ ] HTTPS enabled in production
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Error messages sanitized

---

## 🎉 You're Ready!

Your Solana Transaction Authentication system is now running!

For detailed documentation, see:
- 📘 **README.md** - Complete guide
- 🔧 **API_INTEGRATION.md** - Integration help
- 🚀 **DEPLOYMENT.md** - Production deployment
- 🏗️ **ARCHITECTURE.md** - System design

**Need help?** Check the documentation or open an issue on GitHub!
