import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import merchantRoutes from './routes/merchant.js';
import checkoutRoutes from './routes/checkouts.js';
import paymentRoutes from './routes/payments.js';
import onboardingRoutes from './routes/onboarding.js';

const app = express();

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
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const isOriginAllowed = (origin) => {
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
      const suffix = allowed.slice(1);
      return origin.endsWith(suffix);
    }

    return origin === allowed;
  });
};

app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    const error = new Error(`Origin ${origin} not allowed by CORS`);
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-PAYMENT-RESPONSE'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const payload = {
    error: err.message || 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
});

export default app;
