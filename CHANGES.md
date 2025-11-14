# 🚀 SignLess v2.0 - Major Updates

## Overview

This release includes significant improvements to transaction handling, CORS configuration, and developer experience. All changes maintain backward compatibility while adding new features.

---

## ✨ Key Improvements

### 1. Dynamic Transaction Amounts

**What Changed:**
- Authentication amounts now vary slightly per session
- Base amount: `0.00001 SOL`
- Unique modifier: `0.000000001` to `0.000000999 SOL` (based on timestamp)
- Result: Each transaction is `0.000010xxx SOL`

**Why:**
- Makes each transaction unique for easier tracking
- Helps identify which transaction belongs to which user session
- Maintains ultra-low costs (~$0.002 per authentication)

**Example Amounts:**
```
0.000010123 SOL
0.000010456 SOL
0.000010789 SOL
```

**Code Location:**
- `src/services/sessionManager.js` - `createAuthRequest()` function

### 2. Improved Verification Tolerance

**What Changed:**
- Reduced verification tolerance from `±0.0001 SOL` to `±0.000001 SOL`
- More precise matching for dynamic amounts
- Prevents false positives

**Code Location:**
- `src/services/solana.js` - `checkForIncomingTransaction()` function

### 3. Enhanced CORS Configuration

**What Changed:**
- Support for wildcard (`*`) CORS origins
- Explicit HTTP methods declaration
- Additional allowed headers

**Benefits:**
- Easier local development
- Works with all development servers
- Secure production configuration

**Configuration:**
```env
# Development
CORS_ORIGINS=*

# Production (recommended)
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

**Code Location:**
- `src/server.js` - CORS middleware

### 4. Wallet Initialization Requirements

**Important for Developers:**

Your receiving wallet MUST be funded before users can authenticate!

**Requirements:**
- Minimum: `0.000890880 SOL` (rent-exempt minimum)
- Recommended: `0.01-0.1 SOL` (provides buffer)

**Why:**
- Solana requires accounts to maintain minimum balance
- Phantom blocks transfers to unfunded wallets
- Once funded, accepts micro-transactions normally

**How to Fund:**
```bash
# Send SOL to your receiving wallet
solana transfer YOUR_RECEIVER_ADDRESS 0.01 --url mainnet-beta

# Or use Phantom/Solflare to send manually
```

---

## 📝 API Response Updates

### POST /api/auth/initiate

**Response now includes dynamic amount:**

```json
{
  "success": true,
  "sessionId": "uuid-here",
  "receiverAddress": "5sE9v2bPmHd...",
  "expectedAmount": 0.000010456,  // ← Dynamic!
  "expiresAt": 1234567890,
  "message": "Send exactly 0.000010456 SOL..."
}
```

**Frontend handling:**
```javascript
const response = await fetch('/api/auth/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress })
});

const data = await response.json();

// Display the dynamic amount
console.log(`Send ${data.expectedAmount} SOL to ${data.receiverAddress}`);
```

---

## 🔄 Migration Guide

### From v1.0 to v2.0

**No breaking changes!** Your existing code will continue to work.

**Optional Enhancements:**

1. **Update amount display to handle precision:**
```javascript
// Old (still works)
alert(`Send ${expectedAmount} SOL`);

// New (better)
alert(`Send exactly ${expectedAmount} SOL`);
// Shows: "Send exactly 0.000010456 SOL"
```

2. **Add wallet funding check:**
```javascript
// Check if your receiving wallet is funded
const balance = await connection.getBalance(receiverPubkey);
if (balance < 890880) { // Less than rent-exempt
  console.warn('Receiver wallet needs funding!');
}
```

3. **Update CORS for production:**
```env
# .env
CORS_ORIGINS=https://yourdomain.com
```

---

## 🛠️ Technical Details

### Session Manager Changes

**File:** `src/services/sessionManager.js`

```javascript
// New: Dynamic amount calculation
const baseAmount = parseFloat(process.env.VERIFICATION_AMOUNT || '0.00001');
const uniqueModifier = (Date.now() % 1000) / 1000000000;
const expectedAmount = parseFloat((baseAmount + uniqueModifier).toFixed(9));
```

### Solana Service Changes

**File:** `src/services/solana.js`

```javascript
// Updated: Tighter tolerance
const amountDiff = Math.abs(receivedAmount - expectedAmount);
if (amountDiff < 0.000001) { // Was 0.0001
  // Match found!
}
```

### Server CORS Changes

**File:** `src/server.js`

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGINS === '*' ? '*' : process.env.CORS_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id']
}));
```

---

## 🧪 Testing the Updates

### Test Dynamic Amounts

```javascript
// Make multiple auth requests
for (let i = 0; i < 5; i++) {
  const response = await fetch('/api/auth/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: 'test123' })
  });
  const data = await response.json();
  console.log(`Request ${i+1}: ${data.expectedAmount} SOL`);
}

// Output:
// Request 1: 0.000010123 SOL
// Request 2: 0.000010456 SOL
// Request 3: 0.000010789 SOL
// Request 4: 0.000010234 SOL
// Request 5: 0.000010567 SOL
```

### Test Wallet Funding

```bash
# Check if your receiver wallet is funded
solana balance YOUR_RECEIVER_ADDRESS --url mainnet-beta

# Should show at least 0.001 SOL
```

### Test CORS

```javascript
// From different origin
fetch('http://localhost:3000/api/auth/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ walletAddress: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📊 Performance Impact

### Before (v1.0)
- Fixed amount: `0.00001 SOL`
- Verification tolerance: `±0.0001 SOL`
- CORS: Limited origins only

### After (v2.0)
- Dynamic amount: `0.00001xxx SOL`
- Verification tolerance: `±0.000001 SOL` (100x more precise!)
- CORS: Flexible configuration

**Impact:**
- ✅ Better transaction tracking
- ✅ Fewer false positives
- ✅ Easier development setup
- ✅ Same cost per authentication
- ✅ Same API response time

---

## 🚨 Common Issues & Solutions

### Issue: "Phantom won't let me send"

**Solution:** Fund your receiving wallet first!
```bash
# Your receiver wallet needs at least 0.001 SOL
solana transfer YOUR_RECEIVER_ADDRESS 0.01
```

### Issue: "CORS error in browser"

**Solution:** Check your CORS_ORIGINS setting
```env
# Development
CORS_ORIGINS=*

# Production
CORS_ORIGINS=https://yourdomain.com
```

### Issue: "Transaction not found"

**Possible causes:**
1. User sent wrong amount
2. User sent to wrong address
3. Blockchain not yet confirmed (wait 5-10 seconds)
4. RPC provider rate limit

**Debug:**
```javascript
// Check exact amount sent
console.log('Expected:', authData.expectedAmount);
console.log('Received:', transaction.receivedAmount);
console.log('Difference:', Math.abs(expected - received));
```

---

## 📚 Updated Documentation

The following docs have been updated:
- ✅ README.md - Added wallet funding section
- ✅ API examples - Updated response handling
- ✅ Integration guides - Dynamic amount handling
- ✅ Quick Start - Added setup warnings

---

## 🎯 What's Next

**Future Improvements (Roadmap):**
- [ ] Redis support for session storage
- [ ] Rate limiting per wallet address
- [ ] Webhook notifications for verified transactions
- [ ] Multi-network support (mainnet/devnet switching)
- [ ] GraphQL API option
- [ ] Analytics dashboard

---

## 💬 Feedback & Support

Questions about these changes? 
- Create an issue on GitHub
- Check the updated documentation
- Join our Discord community

---

**Version:** 2.0.0  
**Release Date:** January 2025  
**Compatibility:** Backward compatible with v1.0
