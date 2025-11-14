# 📋 Copy-Paste Integration Snippets

Quick copy-paste code snippets for integrating into your projects.

---

## 🎯 Recommended: Run Auth as Separate Service

### 1. Start the Auth Service

```powershell
# Terminal 1 - In this project directory
npm install
npm start
# Auth service now running on http://localhost:3000
```

---

## 🔌 Integration Snippets for YOUR Projects

### Node.js/Express Backend

```javascript
// ========================================
// FILE: your-project/middleware/auth.js
// ========================================
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';

export async function requireAuth(req, res, next) {
  const sessionId = 
    req.headers['x-session-id'] || 
    req.cookies?.sessionId || 
    req.query?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No session ID provided' 
    });
  }

  try {
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/api/auth/status/${sessionId}`,
      { timeout: 5000 }
    );
    
    if (response.data.status === 'verified') {
      req.user = {
        walletAddress: response.data.walletAddress,
        sessionId: sessionId,
        verifiedAt: response.data.verifiedAt
      };
      next();
    } else {
      res.status(401).json({ 
        error: 'Invalid session',
        status: response.data.status 
      });
    }
  } catch (error) {
    console.error('Auth verification failed:', error);
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
}

// ========================================
// FILE: your-project/server.js
// ========================================
import express from 'express';
import { requireAuth } from './middleware/auth.js';

const app = express();

// Public route - no auth required
app.get('/api/public', (req, res) => {
  res.json({ message: 'Public data' });
});

// Protected route - auth required
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ 
    message: 'You are authenticated!',
    wallet: req.user.walletAddress 
  });
});

// User profile route
app.get('/api/user/profile', requireAuth, (req, res) => {
  res.json({
    wallet: req.user.walletAddress,
    verifiedAt: req.user.verifiedAt
  });
});

app.listen(4000, () => {
  console.log('Your app running on port 4000');
});
```

---

### React Frontend

```javascript
// ========================================
// FILE: your-project/src/hooks/useAuth.js
// ========================================
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3000';

export function useAuth() {
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Check existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('authSession');
    if (stored) {
      verifySession(stored);
    }
  }, []);

  const verifySession = async (sid) => {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/status/${sid}`);
      const data = await response.json();
      
      if (data.status === 'verified') {
        setAuthenticated(true);
        setSessionId(sid);
      } else {
        localStorage.removeItem('authSession');
      }
    } catch (err) {
      console.error('Session verification failed:', err);
    }
  };

  const login = async () => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Initiate authentication
      const initResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey.toString() })
      });
      const authData = await initResponse.json();

      // Step 2: Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(authData.receiverAddress),
          lamports: authData.expectedAmount * LAMPORTS_PER_SOL
        })
      );

      // Step 3: Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Step 4: Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      // Step 5: Verify with backend
      const verifyResponse = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: authData.sessionId, 
          signature 
        })
      });
      const result = await verifyResponse.json();

      if (result.success) {
        setSessionId(result.sessionId);
        setAuthenticated(true);
        localStorage.setItem('authSession', result.sessionId);
        return result;
      } else {
        throw new Error(result.error || 'Authentication failed');
      }

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (sessionId) {
      try {
        await fetch(`${AUTH_SERVICE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } catch (err) {
        console.error('Logout failed:', err);
      }
    }
    
    setAuthenticated(false);
    setSessionId(null);
    localStorage.removeItem('authSession');
  };

  return { authenticated, sessionId, login, logout, loading, error };
}

// ========================================
// FILE: your-project/src/components/AuthButton.jsx
// ========================================
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

export function AuthButton() {
  const { authenticated, login, logout, loading, error } = useAuth();
  const { publicKey } = useWallet();

  if (!publicKey) {
    return <WalletMultiButton />;
  }

  if (authenticated) {
    return (
      <button onClick={logout} className="logout-btn">
        Logout
      </button>
    );
  }

  return (
    <div>
      <button onClick={login} disabled={loading} className="login-btn">
        {loading ? 'Authenticating...' : 'Verify Wallet'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}

// ========================================
// FILE: your-project/src/components/ProtectedRoute.jsx
// ========================================
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children }) {
  const { authenticated } = useAuth();

  if (!authenticated) {
    return <Navigate to="/login" />;
  }

  return children;
}

// Usage:
// <ProtectedRoute>
//   <YourProtectedComponent />
// </ProtectedRoute>

// ========================================
// FILE: your-project/src/utils/api.js
// ========================================
// Helper to make authenticated API calls to YOUR backend
const YOUR_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function authenticatedFetch(endpoint, options = {}) {
  const sessionId = localStorage.getItem('authSession');
  
  if (!sessionId) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${YOUR_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'X-Session-Id': sessionId
    }
  });

  if (response.status === 401) {
    localStorage.removeItem('authSession');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return response.json();
}

// Usage in your components:
// const data = await authenticatedFetch('/api/user/profile');
```

---

### Python/Flask Backend

```python
# ========================================
# FILE: your-project/middleware/auth.py
# ========================================
from flask import request, jsonify
import requests
from functools import wraps
import os

AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:3000')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        session_id = (
            request.headers.get('X-Session-Id') or 
            request.cookies.get('sessionId') or
            request.args.get('sessionId')
        )
        
        if not session_id:
            return jsonify({
                'error': 'Authentication required',
                'message': 'No session ID provided'
            }), 401
        
        try:
            response = requests.get(
                f'{AUTH_SERVICE_URL}/api/auth/status/{session_id}',
                timeout=5
            )
            data = response.json()
            
            if data.get('status') == 'verified':
                request.user = {
                    'walletAddress': data['walletAddress'],
                    'sessionId': session_id,
                    'verifiedAt': data.get('verifiedAt')
                }
                return f(*args, **kwargs)
            else:
                return jsonify({
                    'error': 'Invalid session',
                    'status': data.get('status')
                }), 401
                
        except Exception as e:
            print(f'Auth verification failed: {e}')
            return jsonify({
                'error': 'Authentication service unavailable'
            }), 500
    
    return decorated

# ========================================
# FILE: your-project/app.py
# ========================================
from flask import Flask, jsonify
from middleware.auth import require_auth

app = Flask(__name__)

@app.route('/api/public')
def public_route():
    return jsonify({'message': 'Public data'})

@app.route('/api/protected')
@require_auth
def protected_route():
    return jsonify({
        'message': 'You are authenticated!',
        'wallet': request.user['walletAddress']
    })

@app.route('/api/user/profile')
@require_auth
def user_profile():
    return jsonify({
        'wallet': request.user['walletAddress'],
        'verifiedAt': request.user['verifiedAt']
    })

if __name__ == '__main__':
    app.run(port=4000, debug=True)
```

---

### Next.js API Routes

```javascript
// ========================================
// FILE: your-project/pages/api/auth/check.js
// ========================================
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3000';

export default async function handler(req, res) {
  const sessionId = req.cookies.sessionId || req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/status/${sessionId}`);
    const data = await response.json();

    if (data.status === 'verified') {
      return res.status(200).json({
        authenticated: true,
        wallet: data.walletAddress
      });
    } else {
      return res.status(401).json({ error: 'Invalid session' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Auth check failed' });
  }
}

// ========================================
// FILE: your-project/middleware.js (Next.js 13+)
// ========================================
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const sessionId = request.cookies.get('sessionId')?.value;

  if (!sessionId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const response = await fetch(
      `${process.env.AUTH_SERVICE_URL}/api/auth/status/${sessionId}`
    );
    const data = await response.json();

    if (data.status === 'verified') {
      return NextResponse.next();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*']
};
```

---

## 🎨 Environment Variables

Add to your project's `.env`:

```env
# Auth Service URL
AUTH_SERVICE_URL=http://localhost:3000

# For production:
# AUTH_SERVICE_URL=https://your-deployed-auth-service.com

# Your app's API URL (for frontend)
VITE_API_URL=http://localhost:4000
VITE_AUTH_SERVICE_URL=http://localhost:3000
```

---

## 🚀 Complete Example: Full Integration

```javascript
// ========================================
// COMPLETE EXAMPLE: Simple Protected App
// ========================================

// 1. Start auth service (Terminal 1)
// cd path/to/signless
// npm start

// 2. Create your app (Terminal 2)
// ========================================
// your-app/server.js
// ========================================
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const AUTH_SERVICE = 'http://localhost:3000';

// Middleware
async function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) return res.status(401).json({ error: 'Not authenticated' });
  
  const response = await fetch(`${AUTH_SERVICE}/api/auth/status/${sessionId}`);
  const data = await response.json();
  
  if (data.status === 'verified') {
    req.user = data;
    next();
  } else {
    res.status(401).json({ error: 'Invalid session' });
  }
}

// Routes
app.get('/api/data', requireAuth, (req, res) => {
  res.json({ 
    message: 'Protected data!',
    wallet: req.user.walletAddress 
  });
});

app.listen(4000);

// 3. Run your app
// node server.js

// 4. Make requests
// First authenticate with auth service, get sessionId
// Then call your protected endpoint:
// fetch('http://localhost:4000/api/data', {
//   headers: { 'X-Session-Id': sessionId }
// })
```

---

## 📱 Quick Test Script

```javascript
// ========================================
// test-integration.js - Test your integration
// ========================================
const AUTH_SERVICE = 'http://localhost:3000';
const YOUR_API = 'http://localhost:4000';

async function testIntegration() {
  console.log('🧪 Testing integration...\n');

  // 1. Test auth service health
  const health = await fetch(`${AUTH_SERVICE}/health`);
  console.log('✅ Auth service:', await health.json());

  // 2. Test your API (should fail without auth)
  try {
    const unauthed = await fetch(`${YOUR_API}/api/protected`);
    console.log('❌ Unauthed request status:', unauthed.status);
  } catch (e) {
    console.log('❌ Expected failure:', e.message);
  }

  console.log('\n✅ Integration test passed!');
}

// Run: node test-integration.js
testIntegration();
```

---

## 🎯 What You Need to Do

1. **Start the auth service** (this project): `npm start`
2. **Copy the relevant snippet** for your tech stack
3. **Add the middleware** to your backend
4. **Test** with the test script above
5. **Protect your routes** with `requireAuth` middleware

That's it! Your app now has Solana wallet authentication! 🎉

---

## 💡 Pro Tips

- Store `sessionId` in `localStorage` (frontend) or `httpOnly cookies` (production)
- Always check auth status on page load
- Handle session expiry gracefully
- Use environment variables for service URLs
- Test on devnet before mainnet

---

**Need more help?** Check [YOUR_PROJECT_INTEGRATION.md](./YOUR_PROJECT_INTEGRATION.md) for detailed explanations!
