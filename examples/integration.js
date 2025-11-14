// Example: Complete integration of Solana Transaction Auth
// This file shows how developers can integrate the authentication system

import express from 'express';
import axios from 'axios';

// ==========================================
// CONFIGURATION
// ==========================================

const AUTH_API_URL = 'http://localhost:3000'; // Your auth API URL
const app = express();
app.use(express.json());

// ==========================================
// CLIENT-SIDE IMPLEMENTATION (JavaScript)
// ==========================================

/**
 * Example 1: Basic Integration
 * Copy this to your frontend
 */
class SolanaAuthClient {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
  }

  /**
   * Step 1: Initiate authentication
   */
  async initiate(walletAddress) {
    const response = await fetch(`${this.apiUrl}/api/auth/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate authentication');
    }

    return await response.json();
  }

  /**
   * Step 2: Verify transaction
   */
  async verify(sessionId, signature) {
    const response = await fetch(`${this.apiUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, signature })
    });

    if (!response.ok) {
      throw new Error('Failed to verify transaction');
    }

    return await response.json();
  }

  /**
   * Step 3: Check status (for polling)
   */
  async checkStatus(sessionId) {
    const response = await fetch(`${this.apiUrl}/api/auth/status/${sessionId}`);
    
    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    return await response.json();
  }

  /**
   * Helper: Poll for authentication completion
   */
  async pollForAuth(sessionId, maxAttempts = 60, intervalMs = 3000) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkStatus(sessionId);
      
      if (status.status === 'verified') {
        return { success: true, data: status };
      }
      
      if (status.status === 'expired') {
        return { success: false, error: 'Session expired' };
      }
      
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    return { success: false, error: 'Timeout' };
  }

  /**
   * Logout
   */
  async logout(sessionId) {
    const response = await fetch(`${this.apiUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    return await response.json();
  }
}

// ==========================================
// USAGE EXAMPLE 1: With Phantom Wallet
// ==========================================

async function authenticateWithPhantom() {
  const authClient = new SolanaAuthClient(AUTH_API_URL);

  try {
    // Check if Phantom is installed
    const { solana } = window;
    if (!solana || !solana.isPhantom) {
      throw new Error('Please install Phantom wallet');
    }

    // Connect wallet
    await solana.connect();
    const walletAddress = solana.publicKey.toString();
    console.log('Wallet connected:', walletAddress);

    // Initiate authentication
    const authData = await authClient.initiate(walletAddress);
    console.log('Auth initiated:', authData);

    // Create transaction
    const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = window.solanaWeb3;
    const connection = new Connection('https://api.devnet.solana.com');
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: solana.publicKey,
        toPubkey: new PublicKey(authData.receiverAddress),
        lamports: authData.expectedAmount * LAMPORTS_PER_SOL
      })
    );

    // Send transaction
    const { signature } = await solana.signAndSendTransaction(transaction);
    console.log('Transaction sent:', signature);

    // Wait for confirmation
    await connection.confirmTransaction(signature);
    console.log('Transaction confirmed');

    // Verify with backend
    const result = await authClient.verify(authData.sessionId, signature);
    console.log('Authentication result:', result);

    if (result.success) {
      // Store session
      localStorage.setItem('authSession', result.sessionId);
      localStorage.setItem('walletAddress', result.walletAddress);
      
      // Redirect or update UI
      console.log('✅ Authentication successful!');
      return result;
    } else {
      throw new Error(result.error || 'Authentication failed');
    }

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// ==========================================
// USAGE EXAMPLE 2: Server-Side Verification
// ==========================================

/**
 * Middleware to verify authenticated users
 */
async function authenticateUser(req, res, next) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;

  if (!sessionId) {
    return res.status(401).json({ error: 'No session ID provided' });
  }

  try {
    const response = await axios.get(`${AUTH_API_URL}/api/auth/status/${sessionId}`);
    const status = response.data;

    if (status.status === 'verified') {
      // Attach user info to request
      req.user = {
        walletAddress: status.walletAddress,
        sessionId: sessionId,
        verifiedAt: status.verifiedAt
      };
      next();
    } else {
      res.status(401).json({ 
        error: 'Invalid or expired session',
        status: status.status 
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication verification failed' });
  }
}

/**
 * Protected route example
 */
app.get('/api/user/profile', authenticateUser, (req, res) => {
  res.json({
    message: 'Welcome to your profile',
    wallet: req.user.walletAddress,
    authenticatedAt: req.user.verifiedAt
  });
});

/**
 * Example: Get user's NFTs (protected route)
 */
app.get('/api/user/nfts', authenticateUser, async (req, res) => {
  try {
    // User is authenticated, req.user contains wallet info
    const walletAddress = req.user.walletAddress;
    
    // Fetch NFTs for this wallet
    // (Example - implement actual NFT fetching)
    const nfts = await fetchUserNFTs(walletAddress);
    
    res.json({
      wallet: walletAddress,
      nfts: nfts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// USAGE EXAMPLE 3: React Hook
// ==========================================

/**
 * Custom React hook for authentication
 * Copy this to your React project
 */
function useSolanaAuth(apiUrl) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [session, setSession] = React.useState(null);

  const authenticate = async (wallet, sendTransaction, connection) => {
    setLoading(true);
    setError(null);

    try {
      // Initiate
      const initResponse = await fetch(`${apiUrl}/api/auth/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: wallet.publicKey.toString() })
      });
      const authData = await initResponse.json();

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(authData.receiverAddress),
          lamports: authData.expectedAmount * LAMPORTS_PER_SOL
        })
      );

      // Send
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature);

      // Verify
      const verifyResponse = await fetch(`${apiUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: authData.sessionId, 
          signature 
        })
      });
      const result = await verifyResponse.json();

      if (result.success) {
        setSession(result);
        localStorage.setItem('authSession', result.sessionId);
      } else {
        throw new Error(result.error);
      }

      return result;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (session?.sessionId) {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId })
      });
    }
    setSession(null);
    localStorage.removeItem('authSession');
  };

  return { authenticate, logout, loading, error, session };
}

// ==========================================
// USAGE EXAMPLE 4: Vue.js Integration
// ==========================================

/**
 * Vue.js composition API example
 */
const useSolanaAuthVue = () => {
  const loading = ref(false);
  const error = ref(null);
  const session = ref(null);

  const authenticate = async (walletAddress, signature) => {
    loading.value = true;
    error.value = null;

    try {
      // Your authentication logic here
      const response = await fetch(`${AUTH_API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, signature })
      });

      const result = await response.json();
      
      if (result.success) {
        session.value = result;
      } else {
        throw new Error(result.error);
      }

    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return { authenticate, loading, error, session };
};

// ==========================================
// USAGE EXAMPLE 5: Next.js API Route
// ==========================================

/**
 * Next.js API route for server-side verification
 * Save as: pages/api/auth/verify.js
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.body;

  try {
    const response = await fetch(`${AUTH_API_URL}/api/auth/status/${sessionId}`);
    const status = await response.json();

    if (status.status === 'verified') {
      // Set secure HTTP-only cookie
      res.setHeader('Set-Cookie', `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/`);
      
      return res.status(200).json({
        success: true,
        wallet: status.walletAddress
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  const sessionId = localStorage.getItem('authSession');
  return sessionId !== null;
}

/**
 * Get current session ID
 */
function getSessionId() {
  return localStorage.getItem('authSession');
}

/**
 * Get authenticated wallet address
 */
function getWalletAddress() {
  return localStorage.getItem('walletAddress');
}

/**
 * Clear authentication
 */
function clearAuth() {
  localStorage.removeItem('authSession');
  localStorage.removeItem('walletAddress');
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(url, options = {}) {
  const sessionId = getSessionId();
  
  if (!sessionId) {
    throw new Error('Not authenticated');
  }

  const headers = {
    ...options.headers,
    'X-Session-Id': sessionId
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    clearAuth();
    throw new Error('Session expired');
  }

  return response;
}

// ==========================================
// TESTING HELPERS
// ==========================================

/**
 * Test the authentication flow
 */
async function testAuthFlow() {
  const authClient = new SolanaAuthClient(AUTH_API_URL);
  
  console.log('🧪 Testing authentication flow...');
  
  try {
    // Test initiation
    console.log('1. Testing initiation...');
    const authData = await authClient.initiate('TestWalletAddress123');
    console.log('✅ Initiation successful:', authData);
    
    // Test status check
    console.log('2. Testing status check...');
    const status = await authClient.checkStatus(authData.sessionId);
    console.log('✅ Status check successful:', status);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// ==========================================
// EXPORT FOR USE
// ==========================================

export {
  SolanaAuthClient,
  authenticateWithPhantom,
  authenticateUser,
  useSolanaAuth,
  isAuthenticated,
  getSessionId,
  getWalletAddress,
  clearAuth,
  authenticatedFetch,
  testAuthFlow
};

// ==========================================
// START EXAMPLE SERVER
// ==========================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`📡 Example integration server running on port ${PORT}`);
    console.log(`Test protected route: http://localhost:${PORT}/api/user/profile`);
  });
}
