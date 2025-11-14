import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

let connection;
let lastCheckedSignatures = new Map(); // Track last checked signature per session

export const initializeSolanaConnection = async () => {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  connection = new Connection(rpcUrl, 'confirmed');
  
  console.log('✅ Solana connection initialized');
  
  // Verify connection
  try {
    const version = await connection.getVersion();
    console.log('📡 Connected to Solana cluster version:', version['solana-core']);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Solana:', error.message);
    throw error;
  }
};

export const getConnection = () => {
  if (!connection) {
    throw new Error('Solana connection not initialized');
  }
  return connection;
};

/**
 * Monitor blockchain for incoming transactions matching expected criteria
 * This is the MAIN method for manual transaction authentication
 * @param {string} expectedSender - Wallet address that should send the transaction
 * @param {string} receiverAddress - Address receiving the verification payment
 * @param {number} expectedAmount - Expected amount in SOL
 * @returns {Promise<Object>} Transaction match result
 */
export const checkForIncomingTransaction = async (expectedSender, receiverAddress, expectedAmount) => {
  try {
    const conn = getConnection();
    const receiverPubkey = new PublicKey(receiverAddress);
    
    // Get recent transactions for receiver address
    const signatures = await conn.getSignaturesForAddress(
      receiverPubkey,
      { limit: 20 }, // Check last 20 transactions
      'confirmed'
    );

    // Check each transaction
    for (const signatureInfo of signatures) {
      const signature = signatureInfo.signature;
      
      // Fetch full transaction details
      const transaction = await conn.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!transaction || transaction.meta.err) {
        continue; // Skip failed transactions
      }

      // Get the sender (fee payer / first signer)
      const accountKeys = transaction.transaction.message.staticAccountKeys || 
                         transaction.transaction.message.accountKeys;
      const sender = accountKeys[0].toString();
      
      // Check if sender matches expected wallet
      if (sender !== expectedSender) {
        continue;
      }

      // Find receiver in transaction
      const receiverIndex = accountKeys.findIndex(key => key.equals(receiverPubkey));

      if (receiverIndex === -1) {
        continue;
      }

      // Calculate received amount
      const preBalance = transaction.meta.preBalances[receiverIndex];
      const postBalance = transaction.meta.postBalances[receiverIndex];
      const receivedAmount = (postBalance - preBalance) / LAMPORTS_PER_SOL;

      // Check if amount matches (with small margin for precision)
      // Allow tolerance of 0.000001 SOL (1000 lamports) for rounding
      const amountDiff = Math.abs(receivedAmount - expectedAmount);
      if (amountDiff < 0.000001) {
        // Match found!
        return { 
          found: true, 
          signature,
          receivedAmount,
          blockTime: transaction.blockTime,
          slot: transaction.slot
        };
      }
    }

    return { found: false };

  } catch (error) {
    console.error('Transaction monitoring error:', error);
    return { found: false, error: error.message };
  }
};

/**
 * Verify a specific transaction signature (legacy/optional method)
 * @param {string} signature - Transaction signature
 * @param {string} fromAddress - Expected sender address
 * @param {string} toAddress - Expected receiver address
 * @param {number} expectedAmount - Expected amount in SOL
 * @returns {Promise<Object>} Verification result
 */
export const verifyTransaction = async (signature, fromAddress, toAddress, expectedAmount) => {
  try {
    const conn = getConnection();
    
    // Get transaction details
    const transaction = await conn.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      return {
        verified: false,
        error: 'Transaction not found or not yet confirmed'
      };
    }

    // Check if transaction was successful
    if (transaction.meta.err !== null) {
      return {
        verified: false,
        error: 'Transaction failed on chain'
      };
    }

    // Verify sender and receiver
    const fromPubkey = new PublicKey(fromAddress);
    const toPubkey = new PublicKey(toAddress);

    // Get pre and post balances
    const accountKeys = transaction.transaction.message.staticAccountKeys || 
                       transaction.transaction.message.accountKeys;
    
    const fromIndex = accountKeys.findIndex(key => key.equals(fromPubkey));
    const toIndex = accountKeys.findIndex(key => key.equals(toPubkey));

    if (fromIndex === -1 || toIndex === -1) {
      return {
        verified: false,
        error: 'Sender or receiver not found in transaction'
      };
    }

    // Calculate actual transferred amount
    const preBalances = transaction.meta.preBalances;
    const postBalances = transaction.meta.postBalances;
    const receivedAmount = (postBalances[toIndex] - preBalances[toIndex]) / LAMPORTS_PER_SOL;

    // Allow small tolerance for fees
    const tolerance = 0.0001;
    const amountMatches = Math.abs(receivedAmount - expectedAmount) <= tolerance;

    if (!amountMatches) {
      return {
        verified: false,
        error: `Amount mismatch. Expected: ${expectedAmount} SOL, Received: ${receivedAmount} SOL`,
        receivedAmount
      };
    }

    return {
      verified: true,
      signature,
      from: fromAddress,
      to: toAddress,
      amount: receivedAmount,
      blockTime: transaction.blockTime,
      slot: transaction.slot
    };

  } catch (error) {
    console.error('Transaction verification error:', error);
    return {
      verified: false,
      error: error.message
    };
  }
};

/**
 * Monitor for incoming transactions to a specific address
 * @param {string} address - Address to monitor
 * @param {Function} callback - Callback for new transactions
 */
export const monitorAddress = async (address, callback) => {
  const conn = getConnection();
  const pubkey = new PublicKey(address);

  try {
    // Subscribe to account changes
    const subscriptionId = conn.onAccountChange(
      pubkey,
      async (accountInfo, context) => {
        console.log('Account change detected:', {
          slot: context.slot,
          lamports: accountInfo.lamports
        });
        
        // Get recent signatures for this account
        const signatures = await conn.getSignaturesForAddress(pubkey, { limit: 5 });
        
        if (signatures.length > 0) {
          callback(signatures[0].signature, accountInfo);
        }
      },
      'confirmed'
    );

    console.log(`👀 Monitoring address: ${address}`);
    return subscriptionId;
  } catch (error) {
    console.error('Error setting up address monitor:', error);
    throw error;
  }
};

/**
 * Get recent transactions for an address
 * @param {string} address - Solana address
 * @param {number} limit - Number of transactions to fetch
 */
export const getRecentTransactions = async (address, limit = 10) => {
  try {
    const conn = getConnection();
    const pubkey = new PublicKey(address);
    
    const signatures = await conn.getSignaturesForAddress(pubkey, { limit });
    return signatures;
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    throw error;
  }
};

/**
 * Check if a wallet address is valid
 * @param {string} address - Address to validate
 */
export const isValidAddress = (address) => {
  try {
    const pubkey = new PublicKey(address);
    return PublicKey.isOnCurve(pubkey.toBuffer());
  } catch (error) {
    return false;
  }
};
