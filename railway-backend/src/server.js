import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import { initializeSolanaConnection } from './services/solana.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const parseAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || raw.trim() === '') {
    return '*';
  }

  if (raw.trim() === '*') {
    return '*';
  }

  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const originMatcher = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins === '*') {
    return true;
  }

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') {
      return true;
    }

    if (allowed.startsWith('*.')) {
      const withoutWildcard = allowed.slice(1);
      return origin.endsWith(withoutWildcard);
    }

    return origin === allowed;
  });
};

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (originMatcher(origin)) {
      return callback(null, true);
    }

    const error = new Error(`Origin ${origin} not allowed by CORS`);
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id']
}));
app.use(express.json());

// Initialize Solana connection
await initializeSolanaConnection();

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    network: process.env.SOLANA_RPC_URL 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Solana Transaction Auth API running on port ${PORT}`);
  console.log(`📡 Network: ${process.env.SOLANA_RPC_URL}`);
  console.log(`💼 Receiver wallet: ${process.env.RECEIVER_WALLET_ADDRESS}`);
});

export default app;
