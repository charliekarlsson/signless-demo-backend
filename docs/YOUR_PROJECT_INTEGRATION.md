# 🔧 Integration Guide: Using This in Your Own Projects

This guide shows you how to integrate the Solana Transaction Authentication system into YOUR existing projects.

## 📋 Table of Contents

1. [Quick Integration Overview](#quick-integration-overview)
2. [Backend Integration](#backend-integration)
3. [Frontend Integration](#frontend-integration)
4. [Full Stack Integration](#full-stack-integration)
5. [Common Use Cases](#common-use-cases)

---

## Quick Integration Overview

You have **three main options**:

### Option 1: Run as Separate Service (Microservice)
✅ **Best for:** Any project, any tech stack  
✅ **Effort:** Minimal  
✅ **Flexibility:** Maximum  

Run this auth system separately and make API calls from your project.

### Option 2: Embed Backend Code
✅ **Best for:** Node.js/Express projects  
✅ **Effort:** Low  
✅ **Flexibility:** High  

Copy the backend routes into your existing Node.js server.

### Option 3: Use Frontend Component Only
✅ **Best for:** React projects with existing backend  
✅ **Effort:** Medium  
✅ **Flexibility:** Medium  

Copy the React component and handle auth in your own backend.

---

## 🎯 Option 1: Run as Separate Service (RECOMMENDED)

This is the **easiest and most flexible** approach. Run the auth system as a separate service.

### Step 1: Deploy the Auth Service

```powershell
# In this project directory
npm install
npm start
```

Now it's running on `http://localhost:3000`

### Step 2: Integrate into Your Project

#### Example: Your Node.js/Express Project

```javascript
// your-project/server.js
import express from 'express';
import axios from 'axios';

const app = express();
const AUTH_SERVICE_URL = 'http://localhost:3000'; // Or your deployed URL

// Middleware to check if user is authenticated
async function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.cookies.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Check with auth service
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/auth/status/${sessionId}`
    );
    
    if (response.data.status === 'verified') {
      req.user = {
        walletAddress: response.data.walletAddress,
        sessionId: sessionId
      };
      next();
    } else {
      res.status(401).json({ error: 'Invalid session' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Auth check failed' });
  }
}

// Use the middleware on protected routes
app.get('/api/my-protected-route', requireAuth, (req, res) => {
  res.json({
    message: 'Welcome!',
    wallet: req.user.walletAddress
  });
});

// Your other routes...
app.listen(4000);
```

#### Example: Your React Frontend

```javascript
// your-project/src/components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';

const AUTH_SERVICE_URL = 'http://localhost:3000';
const YOUR_API_URL = 'http://localhost:4000';

function Login() {
  const [sessionId, setSessionId] = useState(null);

  const handleLogin = async () => {
    // Get user's wallet (from Phantom, etc.)
    const { solana } = window;
    await solana.connect();
    const walletAddress = solana.publicKey.toString();

    // Step 1: Initiate auth with auth service
    const { data } = await axios.post(`${AUTH_SERVICE_URL}/api/auth/initiate`, {
      walletAddress
    });

    // Step 2: Send transaction (simplified)
    // ... user sends transaction ...

    // Step 3: Verify
    const result = await axios.post(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      sessionId: data.sessionId,
      signature: transactionSignature
    });

    if (result.data.success) {
      // Store session
      setSessionId(result.data.sessionId);
      localStorage.setItem('authSession', result.data.sessionId);
      
      // Now you can make authenticated requests to YOUR API
      makeAuthenticatedRequest(result.data.sessionId);
    }
  };

  const makeAuthenticatedRequest = async (sessionId) => {
    // Call YOUR API with the session ID
    const response = await axios.get(`${YOUR_API_URL}/api/my-protected-route`, {
      headers: {
        'X-Session-Id': sessionId
      }
    });
    
    console.log('Your API response:', response.data);
  };

  return (
    <button onClick={handleLogin}>
      Sign In with Solana
    </button>
  );
}
```

#### Example: Your Python/Flask Project

```python
# your-project/app.py
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)
AUTH_SERVICE_URL = 'http://localhost:3000'

def require_auth(f):
    def decorated(*args, **kwargs):
        session_id = request.headers.get('X-Session-Id')
        
        if not session_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Check with auth service
        response = requests.get(
            f'{AUTH_SERVICE_URL}/api/auth/status/{session_id}'
        )
        
        if response.json().get('status') == 'verified':
            # User is authenticated
            request.user = response.json()
            return f(*args, **kwargs)
        else:
            return jsonify({'error': 'Invalid session'}), 401
    
    decorated.__name__ = f.__name__
    return decorated

@app.route('/api/my-protected-route')
@require_auth
def protected_route():
    return jsonify({
        'message': 'Welcome!',
        'wallet': request.user['walletAddress']
    })
```

---

## 🔌 Option 2: Embed Backend Code

If you're building a Node.js/Express app, you can copy the auth code directly into your project.

### Step 1: Copy the Services

```powershell
# Copy these files to your project:
# your-project/src/services/solana.js
# your-project/src/services/sessionManager.js
```

Copy:
- `src/services/solana.js` → Your project
- `src/services/sessionManager.js` → Your project

### Step 2: Copy the Routes

```powershell
# Copy this file to your project:
# your-project/src/routes/auth.js
```

Copy:
- `src/routes/auth.js` → Your project

### Step 3: Integrate into Your Express App

```javascript
// your-project/src/server.js
import express from 'express';
import authRoutes from './routes/auth.js'; // The copied auth routes
import { initializeSolanaConnection } from './services/solana.js';

const app = express();

// Initialize Solana
await initializeSolanaConnection();

// Add auth routes to your app
app.use('/api/auth', authRoutes);

// Your existing routes
app.get('/api/your-route', (req, res) => {
  // Your code
});

app.listen(3000);
```

### Step 4: Add Environment Variables

Add to your `.env`:

```env
SOLANA_RPC_URL=https://api.devnet.solana.com
RECEIVER_WALLET_ADDRESS=YourWalletAddressHere
VERIFICATION_AMOUNT=0.00001
SESSION_EXPIRY_MINUTES=15
```

### Step 5: Install Dependencies

```powershell
npm install @solana/web3.js uuid
```

---

## ⚛️ Option 3: Use Frontend Component Only

If you just want the UI component and will handle auth in your own backend.

### Step 1: Copy the Component

Copy these files to your React project:
- `frontend/src/components/TransactionAuth.jsx`
- `frontend/src/components/TransactionAuth.css`

### Step 2: Install Dependencies

```powershell
npm install @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/web3.js axios
```

### Step 3: Integrate into Your App

```javascript
// your-project/src/App.jsx
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import TransactionAuth from './components/TransactionAuth';

import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const endpoint = clusterApiUrl('devnet');
  const wallets = [new PhantomWalletAdapter()];

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Your existing app */}
          <YourExistingApp />
          
          {/* Add the auth component */}
          <TransactionAuth />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

### Step 4: Modify to Use Your Backend

Edit `TransactionAuth.jsx` to point to YOUR backend:

```javascript
// Change this line:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// To:
const API_URL = 'http://your-backend-url.com';
```

Then implement the `/api/auth/*` endpoints in your backend using the Solana verification logic.

---

## 🎯 Common Use Cases

### Use Case 1: Add Auth to Existing dApp

**Scenario:** You have a Solana dApp and want to add authentication.

**Solution:** Option 1 (Separate Service)

```javascript
// In your existing dApp
import { useWallet } from '@solana/wallet-adapter-react';

function YourDApp() {
  const { publicKey } = useWallet();
  const [authenticated, setAuthenticated] = useState(false);

  const authenticate = async () => {
    // Call the auth service
    const response = await fetch('http://localhost:3000/api/auth/initiate', {
      method: 'POST',
      body: JSON.stringify({ walletAddress: publicKey.toString() })
    });
    // ... complete authentication flow
    setAuthenticated(true);
  };

  if (!authenticated) {
    return <button onClick={authenticate}>Verify Wallet</button>;
  }

  return <YourDAppContent />;
}
```

### Use Case 2: NFT Marketplace with Auth

**Scenario:** Verify users before they can list/buy NFTs.

**Solution:** Option 1 + Middleware

```javascript
// In your marketplace backend
app.post('/api/nft/list', requireAuth, async (req, res) => {
  // User is authenticated, req.user has their wallet
  const nft = await listNFT(req.user.walletAddress, req.body.nftData);
  res.json(nft);
});
```

### Use Case 3: Token-Gated Content

**Scenario:** Grant access to content based on wallet verification.

**Solution:** Option 1 + Content Protection

```javascript
// In your content app
function ProtectedContent() {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const sessionId = localStorage.getItem('authSession');
    if (sessionId) {
      checkAccess(sessionId).then(setHasAccess);
    }
  }, []);

  if (!hasAccess) {
    return <AuthRequired />;
  }

  return <YourProtectedContent />;
}
```

### Use Case 4: DAO Voting Platform

**Scenario:** Verify DAO members before allowing votes.

**Solution:** Option 2 (Embedded)

```javascript
// Embed auth into your DAO backend
app.post('/api/vote', requireAuth, async (req, res) => {
  const wallet = req.user.walletAddress;
  
  // Check if wallet holds DAO tokens
  const hasTokens = await checkDAOTokens(wallet);
  
  if (hasTokens) {
    await recordVote(wallet, req.body.vote);
    res.json({ success: true });
  }
});
```

### Use Case 5: Web3 Game Authentication

**Scenario:** Authenticate players in a blockchain game.

**Solution:** Option 1 + Game Backend

```javascript
// In your game server
app.post('/api/game/start', requireAuth, async (req, res) => {
  const player = await getOrCreatePlayer(req.user.walletAddress);
  const session = await createGameSession(player);
  res.json({ sessionId: session.id, player });
});
```

---

## 🔐 Authentication Flow in Your App

Here's how it works when integrated:

```
Your App Frontend
       │
       │ 1. User clicks "Login"
       ▼
   Auth Service (localhost:3000)
       │
       │ 2. Get session + transaction details
       ▼
Your App Frontend
       │
       │ 3. User sends transaction
       ▼
   Solana Blockchain
       │
       │ 4. Transaction confirmed
       ▼
Your App Frontend
       │
       │ 5. Submit signature for verification
       ▼
   Auth Service (localhost:3000)
       │
       │ 6. Verified! Return sessionId
       ▼
Your App Frontend
       │
       │ 7. Store sessionId
       │ 8. Make authenticated requests to YOUR backend
       ▼
Your App Backend (localhost:4000)
       │
       │ 9. Check sessionId with auth service
       │ 10. Allow/deny access
       ▼
   Return protected data
```

---

## 🛠️ Helper Functions for Your Project

### Universal Auth Helper (Works with Any Framework)

```javascript
// auth-helper.js
export class SolanaAuthClient {
  constructor(authServiceUrl) {
    this.authServiceUrl = authServiceUrl;
  }

  async initiate(walletAddress) {
    const response = await fetch(`${this.authServiceUrl}/api/auth/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });
    return response.json();
  }

  async verify(sessionId, signature) {
    const response = await fetch(`${this.authServiceUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, signature })
    });
    return response.json();
  }

  async checkStatus(sessionId) {
    const response = await fetch(`${this.authServiceUrl}/api/auth/status/${sessionId}`);
    return response.json();
  }

  async logout(sessionId) {
    const response = await fetch(`${this.authServiceUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    return response.json();
  }
}

// Usage in your project:
const authClient = new SolanaAuthClient('http://localhost:3000');
```

### React Hook for Your Projects

```javascript
// useAuth.js - Copy this to your React project
import { useState, useEffect } from 'react';

export function useAuth(authServiceUrl = 'http://localhost:3000') {
  const [sessionId, setSessionId] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('authSession');
    if (stored) {
      setSessionId(stored);
      verifySession(stored);
    }
  }, []);

  const verifySession = async (sid) => {
    const response = await fetch(`${authServiceUrl}/api/auth/status/${sid}`);
    const data = await response.json();
    setAuthenticated(data.status === 'verified');
  };

  const login = async (walletAddress, signature) => {
    // Implement login flow
    // Store sessionId
    // Set authenticated
  };

  const logout = async () => {
    if (sessionId) {
      await fetch(`${authServiceUrl}/api/auth/logout`, {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });
    }
    localStorage.removeItem('authSession');
    setSessionId(null);
    setAuthenticated(false);
  };

  return { authenticated, sessionId, login, logout };
}

// Usage in your components:
function MyComponent() {
  const { authenticated, logout } = useAuth();

  if (!authenticated) {
    return <Login />;
  }

  return (
    <div>
      <h1>Welcome!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 📦 Quick Start for Each Integration Type

### Quick Start: Separate Service

```powershell
# 1. Run auth service
cd path/to/this/project
npm start

# 2. In your project, add the helper
# Copy the SolanaAuthClient code above

# 3. Use it
const auth = new SolanaAuthClient('http://localhost:3000');
const session = await auth.initiate(walletAddress);
```

### Quick Start: Embedded Code

```powershell
# 1. Copy files
cp src/services/* your-project/src/services/
cp src/routes/auth.js your-project/src/routes/

# 2. Add to your server
# Add: app.use('/api/auth', authRoutes);

# 3. Add dependencies
npm install @solana/web3.js uuid
```

### Quick Start: Component Only

```powershell
# 1. Copy component
cp frontend/src/components/TransactionAuth* your-project/src/components/

# 2. Install dependencies
npm install @solana/wallet-adapter-base @solana/wallet-adapter-react

# 3. Use in your app
# Wrap app with wallet providers (see Option 3 above)
```

---

## 🎓 Next Steps

1. **Choose your integration method** (Option 1 recommended)
2. **Follow the specific guide** above
3. **Test with devnet** first
4. **Deploy to production** when ready

## 💡 Tips

- **Start with Option 1** (separate service) - it's the easiest
- **Test thoroughly** with devnet before mainnet
- **Store sessionId** securely (httpOnly cookies in production)
- **Handle errors** gracefully in your UI
- **Monitor** auth success rates

## 🆘 Need Help?

- Check the main [README.md](../README.md)
- Review [API_INTEGRATION.md](./API_INTEGRATION.md)
- See [examples/integration.js](../examples/integration.js)

---

**You're ready to integrate Solana authentication into your project! 🚀**
