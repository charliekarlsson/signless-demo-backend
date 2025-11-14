// SignLess SDK
// Simple JavaScript SDK for SignLess authentication

class SignLess {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.sessionId = null;
    this.walletAddress = null;
    this.checkInterval = null;
    this.callbacks = {
      onVerified: null,
      onTimeout: null,
      onError: null
    };
  }

  /**
   * Initiate authentication request
   * @param {string} walletAddress - Solana wallet public key
   * @returns {Promise<Object>} Transaction details
   */
  async initiate(walletAddress) {
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to initiate authentication');
      }

      const data = await response.json();
      this.sessionId = data.sessionId;
      this.walletAddress = walletAddress;

      // Persist to localStorage
      this.saveSession();

      return {
        sessionId: data.sessionId,
        amount: data.expectedAmount,
        address: data.receiverAddress
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Start polling for verification
   * @param {Object} callbacks - Callback functions
   */
  startPolling(callbacks = {}) {
    if (!this.sessionId) {
      throw new Error('No active session. Call initiate() first');
    }

    this.callbacks = {
      onVerified: callbacks.onVerified || null,
      onTimeout: callbacks.onTimeout || null,
      onError: callbacks.onError || null
    };

    let attempts = 0;
    const maxAttempts = callbacks.maxAttempts || 60;
    const interval = callbacks.interval || 2000;

    this.checkInterval = setInterval(async () => {
      attempts++;

      try {
        const verified = await this.checkVerification();

        if (verified) {
          this.stopPolling();
          if (this.callbacks.onVerified) {
            this.callbacks.onVerified(this.walletAddress);
          }
        }

        if (attempts >= maxAttempts) {
          this.stopPolling();
          if (this.callbacks.onTimeout) {
            this.callbacks.onTimeout();
          }
        }
      } catch (error) {
        console.error('Verification check failed:', error);
        this.handleError(error);
      }
    }, interval);
  }

  /**
   * Check verification status once
   * @returns {Promise<boolean>} Verification status
   */
  async checkVerification() {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/api/auth/verify/${this.sessionId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found or expired');
        }
        throw new Error('Verification request failed');
      }

      const data = await response.json();
      return data.verified;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Stop polling for verification
   */
  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Restore session from localStorage
   * @returns {boolean} Whether session was restored
   */
  restoreSession() {
    const sessionId = localStorage.getItem('signless_sessionId');
    const walletAddress = localStorage.getItem('signless_walletAddress');

    if (sessionId && walletAddress) {
      this.sessionId = sessionId;
      this.walletAddress = walletAddress;
      return true;
    }

    return false;
  }

  /**
   * Save session to localStorage
   */
  saveSession() {
    if (this.sessionId && this.walletAddress) {
      localStorage.setItem('signless_sessionId', this.sessionId);
      localStorage.setItem('signless_walletAddress', this.walletAddress);
    }
  }

  /**
   * Clear session from memory and localStorage
   */
  clearSession() {
    this.stopPolling();
    this.sessionId = null;
    this.walletAddress = null;
    localStorage.removeItem('signless_sessionId');
    localStorage.removeItem('signless_walletAddress');
  }

  /**
   * Get current session information
   * @returns {Object|null} Session info or null
   */
  getSession() {
    if (!this.sessionId) {
      return null;
    }

    return {
      sessionId: this.sessionId,
      walletAddress: this.walletAddress
    };
  }

  /**
   * Check if session is active
   * @returns {boolean} Session status
   */
  isSessionActive() {
    return !!this.sessionId;
  }

  /**
   * Handle errors
   * @private
   */
  handleError(error) {
    if (this.callbacks.onError) {
      this.callbacks.onError(error);
    }
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SignLess;
}

// Example usage:
/*

const auth = new SignLess('http://localhost:3000');

// Start authentication
async function authenticate(walletAddress) {
  try {
    // Initiate authentication
    const { amount, address } = await auth.initiate(walletAddress);
    
    // Display transaction details to user
    console.log('Send', amount, 'SOL to', address);
    
    // Start polling
    auth.startPolling({
      onVerified: (wallet) => {
        console.log('Authentication successful:', wallet);
        // Redirect to app or show authenticated content
      },
      onTimeout: () => {
        console.log('Authentication timeout');
        auth.clearSession();
      },
      onError: (error) => {
        console.error('Authentication error:', error);
      },
      maxAttempts: 60,
      interval: 2000
    });
  } catch (error) {
    console.error('Failed to start authentication:', error);
  }
}

// Restore existing session on page load
if (auth.restoreSession()) {
  auth.checkVerification().then(verified => {
    if (verified) {
      console.log('Session restored:', auth.getSession());
    } else {
      // Continue polling
      auth.startPolling({
        onVerified: (wallet) => console.log('Verified:', wallet),
        onTimeout: () => auth.clearSession()
      });
    }
  }).catch(() => {
    auth.clearSession();
  });
}

// Logout
function logout() {
  auth.clearSession();
  // Redirect to login page
}

*/
