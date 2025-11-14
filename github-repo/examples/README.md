# Examples

Example implementations and integration patterns for SignLess.

## Files

### basic-integration.html

A complete HTML example demonstrating SignLess authentication with:
- Wallet address input
- Transaction details display
- Copy-to-clipboard functionality
- Session persistence with localStorage
- Visual feedback for all states

**Usage:**
1. Start SignLess server
2. Open basic-integration.html in browser
3. Enter Solana wallet address
4. Follow on-screen instructions

### signless-sdk.js

A reusable JavaScript SDK for integrating SignLess into your applications.

**Features:**
- Promise-based API
- Automatic polling with callbacks
- Session persistence
- Error handling
- TypeScript-friendly

**Basic Usage:**

```javascript
const auth = new SignLess('http://localhost:3000');

const { amount, address } = await auth.initiate(walletAddress);
// Display transaction details to user

auth.startPolling({
  onVerified: (wallet) => console.log('Authenticated:', wallet),
  onTimeout: () => console.log('Timeout'),
  onError: (error) => console.error('Error:', error)
});
```

## Integration Patterns

### Pattern 1: Simple Authentication

Use for basic authentication flow:

```javascript
async function simpleAuth(walletAddress) {
  const response = await fetch('http://localhost:3000/api/auth/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  
  const { sessionId, expectedAmount, receiverAddress } = await response.json();
  
  // Display to user
  alert(`Send ${expectedAmount} SOL to ${receiverAddress}`);
  
  // Poll for verification
  const interval = setInterval(async () => {
    const verify = await fetch(`http://localhost:3000/api/auth/verify/${sessionId}`);
    const result = await verify.json();
    
    if (result.verified) {
      clearInterval(interval);
      alert('Authenticated!');
    }
  }, 2000);
}
```

### Pattern 2: React Integration

For React applications:

```javascript
import { useState, useEffect } from 'react';

function useSignLess(apiUrl) {
  const [session, setSession] = useState(null);
  const [verified, setVerified] = useState(false);
  
  const initiate = async (walletAddress) => {
    const response = await fetch(`${apiUrl}/api/auth/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    
    const data = await response.json();
    setSession(data);
    return data;
  };
  
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(async () => {
      const response = await fetch(`${apiUrl}/api/auth/verify/${session.sessionId}`);
      const data = await response.json();
      
      if (data.verified) {
        setVerified(true);
        clearInterval(interval);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [session, apiUrl]);
  
  return { initiate, session, verified };
}

// Usage in component
function AuthButton() {
  const { initiate, session, verified } = useSignLess('http://localhost:3000');
  
  const handleAuth = async () => {
    const data = await initiate('wallet_address_here');
    console.log('Send', data.expectedAmount, 'to', data.receiverAddress);
  };
  
  if (verified) return <div>Authenticated!</div>;
  if (session) return <div>Waiting for transaction...</div>;
  return <button onClick={handleAuth}>Authenticate</button>;
}
```

### Pattern 3: Vue Integration

For Vue.js applications:

```javascript
import { ref, watch } from 'vue';

export function useSignLess(apiUrl) {
  const session = ref(null);
  const verified = ref(false);
  let interval = null;
  
  const initiate = async (walletAddress) => {
    const response = await fetch(`${apiUrl}/api/auth/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    
    session.value = await response.json();
    return session.value;
  };
  
  watch(session, (newSession) => {
    if (!newSession) return;
    
    interval = setInterval(async () => {
      const response = await fetch(`${apiUrl}/api/auth/verify/${newSession.sessionId}`);
      const data = await response.json();
      
      if (data.verified) {
        verified.value = true;
        clearInterval(interval);
      }
    }, 2000);
  });
  
  const cleanup = () => {
    if (interval) clearInterval(interval);
  };
  
  return { initiate, session, verified, cleanup };
}
```

### Pattern 4: Next.js Integration

For Next.js applications:

```javascript
// app/api/auth/route.js
export async function POST(request) {
  const { walletAddress } = await request.json();
  
  const response = await fetch('http://localhost:3000/api/auth/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  
  return response;
}

// Client component
'use client';
import { useState } from 'react';

export default function AuthComponent() {
  const [session, setSession] = useState(null);
  
  const authenticate = async (walletAddress) => {
    const response = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ walletAddress })
    });
    
    const data = await response.json();
    setSession(data);
  };
  
  return (
    <div>
      <button onClick={() => authenticate('wallet_address')}>
        Authenticate
      </button>
      {session && (
        <div>
          Send {session.expectedAmount} SOL to {session.receiverAddress}
        </div>
      )}
    </div>
  );
}
```

### Pattern 5: With Phantom Wallet

Integration with Phantom wallet:

```javascript
async function authenticateWithPhantom() {
  // Connect Phantom
  const provider = window.solana;
  await provider.connect();
  const walletAddress = provider.publicKey.toString();
  
  // Initiate SignLess auth
  const response = await fetch('http://localhost:3000/api/auth/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress })
  });
  
  const { sessionId, expectedAmount, receiverAddress } = await response.json();
  
  // Create and send transaction via Phantom
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey: new PublicKey(receiverAddress),
      lamports: expectedAmount * 1000000000 // Convert SOL to lamports
    })
  );
  
  // Sign and send
  const signature = await provider.signAndSendTransaction(transaction);
  console.log('Transaction sent:', signature);
  
  // Poll for verification
  // ... polling code here
}
```

## Testing

To test examples:

1. Start SignLess server:
```bash
npm start
```

2. For HTML examples:
```bash
# Serve with any HTTP server
npx http-server
```

3. For SDK:
```javascript
// Include in your HTML
<script src="signless-sdk.js"></script>
<script>
  const auth = new SignLess('http://localhost:3000');
  // Use auth object
</script>
```

## Notes

- All examples use localhost:3000 by default
- Update API_URL for production deployments
- Handle errors appropriately in production
- Implement proper loading states
- Add timeout handling
- Consider adding retry logic
- Store session securely

## Additional Resources

- Main README: ../README.md
- API Documentation: ../API.md
- Deployment Guide: ../DEPLOYMENT.md
