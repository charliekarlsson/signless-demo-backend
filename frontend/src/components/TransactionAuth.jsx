import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TransactionAuth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TransactionAuth = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [authDetails, setAuthDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [polling, setPolling] = useState(false);

  // Poll for authentication status
  useEffect(() => {
    if (!polling || !sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/auth/status/${sessionId}`);
        const data = response.data;

        if (data.status === 'verified') {
          setSuccess(true);
          setPolling(false);
          setError(null);
        } else if (data.status === 'expired') {
          setError('Session expired. Please start again.');
          setPolling(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [polling, sessionId]);

  const handleStart = async () => {
    if (!walletAddress.trim()) {
      setError('Please enter your wallet address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Initiate authentication with backend
      const response = await axios.post(`${API_URL}/api/auth/initiate`, {
        walletAddress: walletAddress.trim()
      });

      const { sessionId, receiverAddress, expectedAmount, expiresAt } = response.data;
      
      setSessionId(sessionId);
      setAuthDetails({
        receiverAddress,
        expectedAmount,
        expiresAt
      });

      // Start polling for transaction
      setPolling(true);

    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(authDetails.receiverAddress);
    // Visual feedback could be added here
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(authDetails.expectedAmount.toString());
  };

  const handleReset = () => {
    setWalletAddress('');
    setSessionId(null);
    setAuthDetails(null);
    setError(null);
    setSuccess(false);
    setPolling(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Sign In with Transaction</h1>
        <p className="auth-subtitle">
          Verify your wallet ownership by sending a micro-transaction (no signature popups!)
        </p>

        <div className="auth-content">
          <div className="info-box">
            <div className="info-icon">💳</div>
            <h3 className="info-title">Manual Transaction Authentication</h3>
            <p className="info-text">
              Enter your wallet address, then manually send the specified amount from your wallet app.
              No programmatic signing required - just a simple transaction like sending to a friend.
            </p>
          </div>

          {!success && !authDetails && (
            <>
              <div className="wallet-section">
                <label className="input-label">YOUR WALLET ADDRESS</label>
                <input
                  type="text"
                  className="wallet-input"
                  placeholder="Enter your Solana wallet address..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="error-box">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button
                className={`start-button ${loading ? 'loading' : ''}`}
                onClick={handleStart}
                disabled={loading || !walletAddress.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Starting...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🔄</span>
                    Start Authentication
                  </>
                )}
              </button>
            </>
          )}

          {authDetails && !success && (
            <div className="send-instructions">
              <h3 className="instructions-title">📤 Send Transaction from Your Wallet</h3>
              <p className="instructions-subtitle">
                Open your wallet app (Phantom, Solflare, etc.) and manually send:
              </p>

              <div className="detail-row">
                <div className="detail-label">Amount to Send:</div>
                <div className="detail-value">
                  <code>{authDetails.expectedAmount} SOL</code>
                  <button className="copy-btn-small" onClick={handleCopyAmount} title="Copy amount">
                    📋
                  </button>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Send To Address:</div>
                <div className="detail-value">
                  <code className="address-code">{authDetails.receiverAddress}</code>
                  <button className="copy-btn-small" onClick={handleCopyAddress} title="Copy address">
                    📋
                  </button>
                </div>
              </div>

              <div className="waiting-box">
                <div className="spinner-large"></div>
                <p>Waiting for your transaction...</p>
                <p className="waiting-subtext">
                  This usually takes 5-10 seconds after sending
                </p>
              </div>

              <button className="reset-button-secondary" onClick={handleReset}>
                Cancel
              </button>
            </div>
          )}

          {success && (
            <div className="success-container">
              <div className="success-icon">✅</div>
              <h2 className="success-title">Authentication Successful!</h2>
              <p className="success-text">
                Your wallet has been verified successfully via on-chain transaction.
              </p>
              <div className="success-details">
                <p><strong>Wallet:</strong> <code>{walletAddress}</code></p>
                <p><strong>Session ID:</strong> <code>{sessionId}</code></p>
              </div>
              <button className="reset-button" onClick={handleReset}>
                Authenticate Another Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionAuth;
