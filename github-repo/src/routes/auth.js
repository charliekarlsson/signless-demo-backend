import express from 'express';
import { isValidAddress, verifyTransaction, checkForIncomingTransaction } from '../services/solana.js';
import { 
  createAuthRequest, 
  verifyAuthRequest, 
  getAuthStatus,
  invalidateSession 
} from '../services/sessionManager.js';

const router = express.Router();

/**
 * POST /api/auth/initiate
 * Start authentication process - get transaction details
 */
router.post('/initiate', async (req, res, next) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ 
        error: 'Wallet address is required' 
      });
    }

    // Validate wallet address
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({ 
        error: 'Invalid Solana wallet address' 
      });
    }

    // Create auth request
    const authRequest = createAuthRequest(walletAddress);

    res.json({
      success: true,
      ...authRequest
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify
 * Submit transaction signature for verification (OPTIONAL - for manual signature submission)
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { sessionId, signature } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required' 
      });
    }

    // Get auth request details
    const authStatus = getAuthStatus(sessionId);

    if (authStatus.status === 'not_found') {
      return res.status(404).json({ 
        error: 'Session not found or expired' 
      });
    }

    if (authStatus.status === 'expired') {
      return res.status(400).json({ 
        error: 'Session expired. Please start a new authentication request.' 
      });
    }

    if (authStatus.status === 'verified') {
      return res.json({
        success: true,
        message: 'Already verified',
        ...authStatus
      });
    }

    // If signature provided, verify it
    if (signature) {
      const verificationResult = await verifyTransaction(
        signature,
        authStatus.walletAddress,
        authStatus.receiverAddress,
        authStatus.expectedAmount
      );

      const result = verifyAuthRequest(sessionId, signature, verificationResult);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    }

    // No signature provided - return current status
    res.json({ success: false, ...authStatus });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/status/:sessionId
 * Check authentication status (for polling)
 * This endpoint checks blockchain for matching transactions automatically
 */
router.get('/status/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required' 
      });
    }

    const status = getAuthStatus(sessionId);

    // If already verified or expired, return as-is
    if (status.status === 'verified' || status.status === 'expired' || status.status === 'not_found') {
      return res.json(status);
    }

    // Session is pending - check blockchain for matching transaction
    try {
      const transactionResult = await checkForIncomingTransaction(
        status.walletAddress,
        status.receiverAddress,
        status.expectedAmount
      );

      if (transactionResult.found) {
        // Transaction found! Verify the session
        const verificationResult = {
          verified: true,
          signature: transactionResult.signature,
          amount: transactionResult.receivedAmount,
          blockTime: transactionResult.blockTime
        };

        const result = verifyAuthRequest(sessionId, transactionResult.signature, verificationResult);
        return res.json(result);
      }
    } catch (error) {
      console.error('Error checking for transaction:', error);
      // Don't fail the request, just return pending status
    }

    // No transaction found yet, return pending status
    res.json(status);

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Invalidate session
 */
router.post('/logout', (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ 
        error: 'Session ID is required' 
      });
    }

    const result = invalidateSession(sessionId);
    res.json(result);

  } catch (error) {
    next(error);
  }
});

export default router;