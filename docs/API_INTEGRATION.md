# API Integration Guide

This guide shows developers how to integrate the Solana Transaction Authentication API into their applications.

## Table of Contents

1. [Integration Approaches](#integration-approaches)
2. [Direct API Integration](#direct-api-integration)
3. [Using the Frontend Component](#using-the-frontend-component)
4. [Backend Verification](#backend-verification)
5. [Code Examples](#code-examples)

## Integration Approaches

### Option 1: Hosted API Service

Use our API service (or self-host) and poll for authentication status.

**Pros**:
- No blockchain code needed
- Simple REST API calls
- Works with any programming language

**Cons**:
- Requires polling or webhooks
- Depends on API availability

### Option 2: Self-Hosted

Clone this repository and run your own instance.

**Pros**:
- Full control
- No external dependencies
- Customize as needed
- Transactions go to YOUR wallet

**Cons**:
- Requires server maintenance
- Need to monitor blockchain yourself

## Direct API Integration

### Step-by-Step Flow

#### 1. Initiate Authentication

```javascript
// Your backend/frontend
const initiateAuth = async (userWalletAddress) => {
  const response = await fetch('YOUR_API_URL/api/auth/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress: userWalletAddress
    })
  });

  const data = await response.json();
  
  /*
  Response:
  {
    sessionId: "abc-123",
    receiverAddress: "ReceiverWallet...",
    expectedAmount: 0.00001,
    expiresAt: 1234567890,
    message: "Send exactly 0.00001 SOL to verify..."
  }
  */
  
  return data;
};
```

#### 2. Display Transaction Request to User

Show the user:
- Receiver address
- Amount to send
- Session expiry time

Let them send the transaction using their wallet (Phantom, Solflare, etc.)

#### 3. Get Transaction Signature

After the user sends the transaction, get the signature from their wallet.

```javascript
// Example with Solana wallet adapter
const signature = await wallet.sendTransaction(transaction, connection);
```

#### 4. Verify Transaction

```javascript
const verifyAuth = async (sessionId, signature) => {
  const response = await fetch('YOUR_API_URL/api/auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      signature
    })
  });

  const result = await response.json();
  
  /*
  Response on success:
  {
    success: true,
    sessionId: "abc-123",
    walletAddress: "UserWallet...",
    signature: "TxSignature...",
    verifiedAt: 1234567890
  }
  */
  
  return result;
};
```

#### 5. Handle Success/Failure

```javascript
if (result.success) {
  // User is authenticated
  // Store sessionId for future requests
  localStorage.setItem('authSession', result.sessionId);
  localStorage.setItem('walletAddress', result.walletAddress);
  
  // Redirect to app or show success
  redirectToApp();
} else {
  // Show error message
  showError(result.error);
}
```

## Using the Frontend Component

### React Integration

If you're using React, you can use our pre-built component:

```bash
cd frontend
npm install
```

Then copy the component into your project:

```javascript
import TransactionAuth from './components/TransactionAuth';

function App() {
  return (
    <div>
      <TransactionAuth 
        apiUrl="YOUR_API_URL"
        onSuccess={(authData) => {
          console.log('Authenticated!', authData);
          // Handle success
        }}
        onError={(error) => {
          console.error('Auth failed:', error);
          // Handle error
        }}
      />
    </div>
  );
}
```

### Vanilla JavaScript Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>Solana Auth Demo</title>
  <script src="https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js"></script>
</head>
<body>
  <div id="auth-container">
    <input type="text" id="wallet-input" placeholder="Enter Solana wallet address">
    <button onclick="authenticate()">Sign In</button>
    <div id="status"></div>
  </div>

  <script>
    const API_URL = 'http://localhost:3000';
    
    async function authenticate() {
      const walletAddress = document.getElementById('wallet-input').value;
      const statusDiv = document.getElementById('status');
      
      try {
        // Step 1: Initiate
        const initResponse = await fetch(`${API_URL}/api/auth/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        });
        
        const authData = await initResponse.json();
        statusDiv.innerHTML = `Please send ${authData.expectedAmount} SOL to ${authData.receiverAddress}`;
        
        // Step 2: User sends transaction (integrate with wallet here)
        // const signature = await sendTransactionFromWallet(...);
        
        // Step 3: Verify (after transaction is sent)
        // const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ 
        //     sessionId: authData.sessionId, 
        //     signature 
        //   })
        // });
        
        // const result = await verifyResponse.json();
        // if (result.success) {
        //   statusDiv.innerHTML = 'Authentication successful!';
        // }
        
      } catch (error) {
        statusDiv.innerHTML = `Error: ${error.message}`;
      }
    }
  </script>
</body>
</html>
```

## Backend Verification

If you're building a backend service, you can verify sessions:

### Node.js/Express Example

```javascript
import express from 'express';
import axios from 'axios';

const app = express();
const AUTH_API = 'http://localhost:3000';

// Middleware to verify user session
const authenticateUser = async (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId) {
    return res.status(401).json({ error: 'No session provided' });
  }
  
  try {
    const response = await axios.get(`${AUTH_API}/api/auth/status/${sessionId}`);
    const status = response.data;
    
    if (status.status === 'verified') {
      req.user = {
        walletAddress: status.walletAddress,
        sessionId: sessionId
      };
      next();
    } else {
      res.status(401).json({ error: 'Invalid or expired session' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication verification failed' });
  }
};

// Protected route example
app.get('/api/protected', authenticateUser, (req, res) => {
  res.json({
    message: 'Access granted',
    user: req.user
  });
});
```

### Python/Flask Example

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)
AUTH_API = 'http://localhost:3000'

def authenticate_user(session_id):
    response = requests.get(f'{AUTH_API}/api/auth/status/{session_id}')
    data = response.json()
    
    if data.get('status') == 'verified':
        return data
    return None

@app.route('/api/protected')
def protected_route():
    session_id = request.headers.get('X-Session-Id')
    
    if not session_id:
        return jsonify({'error': 'No session provided'}), 401
    
    user_data = authenticate_user(session_id)
    
    if user_data:
        return jsonify({
            'message': 'Access granted',
            'wallet': user_data['walletAddress']
        })
    else:
        return jsonify({'error': 'Invalid session'}), 401
```

## Code Examples

### Full React Implementation

```javascript
import React, { useState } from 'react';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const SolanaAuth = ({ apiUrl, onSuccess }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Get wallet from window (Phantom, Solflare, etc.)
      const { solana } = window;
      if (!solana) {
        throw new Error('Please install a Solana wallet');
      }
      
      await solana.connect();
      const publicKey = solana.publicKey.toString();
      
      // 2. Initiate authentication
      const initRes = await fetch(`${apiUrl}/api/auth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey })
      });
      const authData = await initRes.json();
      
      // 3. Create transaction
      const connection = new Connection('https://api.devnet.solana.com');
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: solana.publicKey,
          toPubkey: new PublicKey(authData.receiverAddress),
          lamports: authData.expectedAmount * LAMPORTS_PER_SOL
        })
      );
      
      // 4. Send transaction
      const { signature } = await solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature);
      
      // 5. Verify with backend
      const verifyRes = await fetch(`${apiUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: authData.sessionId, 
          signature 
        })
      });
      const result = await verifyRes.json();
      
      if (result.success) {
        onSuccess(result);
      } else {
        setError(result.error);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <button onClick={handleAuth} disabled={loading}>
        {loading ? 'Authenticating...' : 'Sign In with Wallet'}
      </button>
      {error && <div style={{color: 'red'}}>{error}</div>}
    </div>
  );
};

export default SolanaAuth;
```

### Polling for Status

For scenarios where you want to poll for authentication status:

```javascript
const pollForAuth = async (sessionId, maxAttempts = 60) => {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_URL}/api/auth/status/${sessionId}`);
    const status = await response.json();
    
    if (status.status === 'verified') {
      return { success: true, data: status };
    }
    
    if (status.status === 'expired') {
      return { success: false, error: 'Session expired' };
    }
    
    // Wait 3 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  return { success: false, error: 'Timeout waiting for verification' };
};

// Usage
const result = await pollForAuth('session-id-here');
if (result.success) {
  console.log('Authenticated!', result.data);
}
```

## Testing

### Test with Devnet

Always test with Solana Devnet first:

1. Configure backend to use devnet RPC
2. Get devnet SOL from [faucet](https://solfaucet.com/)
3. Test the full flow
4. Verify transactions on [Solana Explorer](https://explorer.solana.com/?cluster=devnet)

### Test Cases

- Valid wallet address
- Invalid wallet address
- Correct transaction amount
- Incorrect transaction amount
- Session expiry
- Multiple concurrent sessions
- Network errors

## Support

If you need help integrating:
- Check the [main README](../README.md)
- Open an issue on GitHub
- Review the example frontend implementation

## Next Steps

1. Review the [API Documentation](../README.md#api-documentation)
2. Set up a test environment with devnet
3. Integrate into your application
4. Test thoroughly before production
5. Deploy to production with mainnet
