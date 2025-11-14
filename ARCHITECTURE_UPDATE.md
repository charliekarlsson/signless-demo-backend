# 🔄 Architecture Update - Manual Transaction System

## Overview

SignLess has been completely rewritten from a **programmatic signing system** to a **manual transaction system**. This change makes the authentication truly signature-free and significantly more secure against phishing attacks.

## What Changed

### Before (Programmatic Signing)
```javascript
// ❌ OLD WAY - Required wallet adapter and programmatic signing
import { useWallet } from '@solana/wallet-adapter-react';

const { sendTransaction } = useWallet();
const signature = await sendTransaction(transaction, connection);
// This STILL required user to approve a signature popup
```

### After (Manual Transaction)
```javascript
// ✅ NEW WAY - User manually sends from their wallet app
// 1. Get wallet address from user (text input)
const walletAddress = document.getElementById('wallet').value;

// 2. Show them what to send
alert(`Send ${amount} SOL to: ${receiverAddress}`);

// 3. Poll for transaction detection
const checkStatus = async () => {
  const res = await fetch(`/api/auth/status/${sessionId}`);
  if (res.data.status === 'verified') {
    // Authenticated!
  }
};
```

## Key Differences

| Aspect | Old (Programmatic) | New (Manual) |
|--------|-------------------|--------------|
| **User Action** | Click approve on popup | Open wallet app, manually send |
| **Frontend Code** | Wallet adapter integration | Simple text input + polling |
| **Backend Verification** | Verify provided signature | Monitor blockchain for transactions |
| **Signature Required?** | YES (programmatic) | NO (manual send) |
| **Phishing Risk** | Medium (can fake popups) | Very Low (user's own wallet UI) |
| **User Experience** | "Click to sign" | "Send like to a friend" |

## Technical Changes

### Backend Changes

#### 1. New Function: `checkForIncomingTransaction()`
```javascript
// src/services/solana.js
export const checkForIncomingTransaction = async (
  expectedSender, 
  receiverAddress, 
  expectedAmount
) => {
  // Scans last 20 transactions to receiver address
  // Matches by sender + amount
  // Returns {found: true, signature, ...} if match found
};
```

#### 2. Updated API Endpoint: `GET /api/auth/status/:sessionId`
```javascript
// src/routes/auth.js
router.get('/status/:sessionId', async (req, res) => {
  const status = getAuthStatus(sessionId);
  
  if (status.status === 'pending') {
    // NEW: Check blockchain for matching transaction
    const txResult = await checkForIncomingTransaction(
      status.walletAddress,
      status.receiverAddress,
      status.expectedAmount
    );
    
    if (txResult.found) {
      // Auto-verify the session
      verifyAuthRequest(sessionId, txResult.signature, {...});
    }
  }
  
  return res.json(status);
});
```

#### 3. Optional Legacy Endpoint: `POST /api/auth/verify`
- Still exists for backwards compatibility
- Signature parameter is now optional
- Primarily used if someone manually provides a transaction signature

### Frontend Changes

#### 1. Removed Wallet Adapter Dependencies
```json
// ❌ REMOVED from package.json
"@solana/wallet-adapter-react"
"@solana/wallet-adapter-react-ui"
"@solana/wallet-adapter-wallets"
```

#### 2. New UI Flow
```javascript
// TransactionAuth.jsx - Completely rewritten
// 1. Text input for wallet address
<input value={walletAddress} onChange={...} />

// 2. Show transaction details with copy buttons
<div>
  <p>Send {amount} SOL to:</p>
  <code>{receiverAddress}</code>
  <button onClick={copyAddress}>📋 Copy</button>
</div>

// 3. Poll for verification
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/auth/status/${sessionId}`);
    if (res.data.status === 'verified') {
      setAuthenticated(true);
    }
  }, 5000);
}, [sessionId]);
```

## User Flow Comparison

### Old Flow (5 steps)
1. Click "Connect Wallet" button
2. Approve wallet connection popup
3. Click "Authenticate" button
4. Approve transaction signature popup
5. Wait for confirmation → Authenticated

### New Flow (4 steps)
1. Enter wallet address in text field
2. Click "Start Authentication"
3. **Open wallet app manually** (Phantom, Solflare, etc.)
4. **Send transaction** (like sending to a friend) → Authenticated

## Security Benefits

### 1. **No Signature Popups**
- Users never approve programmatic signature requests
- Eliminates entire class of phishing attacks

### 2. **Familiar UX**
- Users send transactions the same way they always do
- Uses wallet app's native, trusted UI

### 3. **Complete Transparency**
- Users see exactly what they're sending
- No hidden data in signature requests
- Amount is always visible (0.00001 SOL)

### 4. **Minimal Loss Risk**
- Worst case: user loses 0.00001 SOL ($0.002)
- Compare to signing malicious drain transaction (lose everything)

## Integration Guide

### For Existing Users

If you already have SignLess integrated, update your code:

#### Before:
```javascript
import { useWallet } from '@solana/wallet-adapter-react';

const { publicKey, sendTransaction } = useWallet();
// ... create transaction
const signature = await sendTransaction(tx, connection);
```

#### After:
```javascript
const [walletAddress, setWalletAddress] = useState('');
const [authDetails, setAuthDetails] = useState(null);

// Initiate
const res = await fetch('/api/auth/initiate', {
  body: JSON.stringify({ walletAddress })
});
setAuthDetails(res.data);

// Show user what to send
<p>Send {authDetails.expectedAmount} SOL to {authDetails.receiverAddress}</p>

// Poll for verification
useEffect(() => {
  // Check status every 5 seconds
}, []);
```

### For New Users

See updated examples in:
- `website/index.html` - JavaScript, React, Node.js, Python examples
- `frontend/src/components/TransactionAuth.jsx` - Complete React component
- `website/demo-game.html` - Working pong game demo

## Performance Considerations

### Blockchain Polling
- `/api/auth/status` endpoint now queries Solana RPC
- Fetches last 20 transactions to receiver address
- Recommended: Call every 5 seconds (not more frequent)
- Most transactions detected within 10-15 seconds

### RPC Usage
- Each status check = 1 RPC call (`getSignaturesForAddress`)
- If match found, 1 additional call (`getTransaction`)
- Consider using paid RPC (Helius, QuickNode) for production
- Free RPC limits: ~100 requests/10 seconds

### Scaling
- No websocket subscriptions needed
- Stateless API design
- Can handle thousands of concurrent auth sessions
- Only limitation is RPC rate limits

## Testing

### Test the Manual Flow

1. Start backend: `npm run dev`
2. Open `website/demo-game.html` in browser
3. Enter your wallet address
4. Copy the receiver address shown
5. Open Phantom/Solflare
6. Send 0.00001 SOL to the address
7. Watch authentication complete automatically!

## Migration Checklist

- [ ] Update backend to latest version (`git pull`)
- [ ] Run `npm install` to update dependencies
- [ ] Update `.env` with `RECEIVER_ADDRESS`
- [ ] Remove wallet adapter code from frontend
- [ ] Update frontend to use text input + polling
- [ ] Test manual transaction flow
- [ ] Update documentation for your users
- [ ] Deploy updated version

## Questions?

This is a fundamental architecture change. If you have questions or issues:

1. Check the examples in `website/index.html`
2. Review the working demo in `website/demo-game.html`
3. Read the API docs in `docs/API_INTEGRATION.md`
4. Open an issue on GitHub

## Summary

**SignLess is now truly signature-free!** Users authenticate by manually sending a transaction from their wallet app - no programmatic signing, no signature popups, maximum security against phishing. 🛡️
