import { v4 as uuidv4 } from 'uuid';

// In-memory session storage (use Redis or database in production)
const sessions = new Map();
const pendingAuth = new Map();

const SESSION_EXPIRY = parseInt(process.env.SESSION_EXPIRY_MINUTES || '15') * 60 * 1000;

/**
 * Create a new authentication request
 * @param {string} walletAddress - User's wallet address
 * @returns {Object} Authentication session details
 */
export const createAuthRequest = (walletAddress) => {
  const sessionId = uuidv4();
  const baseAmount = parseFloat(process.env.VERIFICATION_AMOUNT || '0.00001');
  
  // Add a tiny unique amount based on timestamp (last 3 digits of milliseconds)
  // This makes each transaction unique and easier to track
  // Range: 0.000000001 to 0.000000999 SOL (1-999 lamports)
  const uniqueModifier = (Date.now() % 1000) / 1000000000; // 0.000000xxx SOL
  const expectedAmount = parseFloat((baseAmount + uniqueModifier).toFixed(9));
  
  const receiverAddress = process.env.RECEIVER_WALLET_ADDRESS;

  if (!receiverAddress) {
    throw new Error('RECEIVER_WALLET_ADDRESS not configured');
  }

  const authRequest = {
    sessionId,
    walletAddress,
    receiverAddress,
    expectedAmount,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_EXPIRY,
    verified: false
  };

  pendingAuth.set(sessionId, authRequest);

  // Auto-cleanup after expiry
  setTimeout(() => {
    if (pendingAuth.has(sessionId)) {
      pendingAuth.delete(sessionId);
      console.log(`🗑️ Expired session cleaned up: ${sessionId}`);
    }
  }, SESSION_EXPIRY);

  return {
    sessionId,
    receiverAddress,
    expectedAmount,
    expiresAt: authRequest.expiresAt,
    message: `Send exactly ${expectedAmount} SOL to ${receiverAddress} to verify your wallet ownership`
  };
};

/**
 * Verify transaction and update session
 * @param {string} sessionId - Session ID
 * @param {string} signature - Transaction signature
 * @param {Object} verificationResult - Result from Solana verification
 * @returns {Object} Updated session
 */
export const verifyAuthRequest = (sessionId, signature, verificationResult) => {
  const authRequest = pendingAuth.get(sessionId);

  if (!authRequest) {
    throw new Error('Session not found or expired');
  }

  if (Date.now() > authRequest.expiresAt) {
    pendingAuth.delete(sessionId);
    throw new Error('Session expired');
  }

  if (!verificationResult.verified) {
    return {
      success: false,
      error: verificationResult.error || 'Transaction verification failed'
    };
  }

  // Mark as verified and create session
  authRequest.status = 'verified';
  authRequest.verified = true;
  authRequest.signature = signature;
  authRequest.verifiedAt = Date.now();

  // Move to active sessions
  sessions.set(sessionId, authRequest);
  pendingAuth.delete(sessionId);

  console.log(`✅ Wallet authenticated: ${authRequest.walletAddress}`);

  return {
    success: true,
    sessionId,
    walletAddress: authRequest.walletAddress,
    signature,
    verifiedAt: authRequest.verifiedAt
  };
};

/**
 * Check the status of an authentication request
 * @param {string} sessionId - Session ID
 * @returns {Object} Session status
 */
export const getAuthStatus = (sessionId) => {
  // Check active sessions first
  if (sessions.has(sessionId)) {
    const session = sessions.get(sessionId);
    return {
      status: 'verified',
      verified: true,
      walletAddress: session.walletAddress,
      signature: session.signature,
      verifiedAt: session.verifiedAt
    };
  }

  // Check pending auth
  if (pendingAuth.has(sessionId)) {
    const authRequest = pendingAuth.get(sessionId);
    
    if (Date.now() > authRequest.expiresAt) {
      pendingAuth.delete(sessionId);
      return {
        status: 'expired',
        verified: false,
        error: 'Session expired'
      };
    }

    return {
      status: 'pending',
      verified: false,
      walletAddress: authRequest.walletAddress,
      expiresAt: authRequest.expiresAt,
      expectedAmount: authRequest.expectedAmount,
      receiverAddress: authRequest.receiverAddress
    };
  }

  return {
    status: 'not_found',
    verified: false,
    error: 'Session not found'
  };
};

/**
 * Invalidate a session (logout)
 * @param {string} sessionId - Session ID
 */
export const invalidateSession = (sessionId) => {
  sessions.delete(sessionId);
  pendingAuth.delete(sessionId);
  return { success: true, message: 'Session invalidated' };
};

/**
 * Get all pending authentications for monitoring
 */
export const getPendingAuths = () => {
  return Array.from(pendingAuth.values());
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = () => {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, auth] of pendingAuth.entries()) {
    if (now > auth.expiresAt) {
      pendingAuth.delete(sessionId);
      cleaned++;
    }
  }

  console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
  return cleaned;
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
