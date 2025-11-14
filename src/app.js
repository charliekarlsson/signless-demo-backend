import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import merchantRoutes from './routes/merchant.js';
import checkoutRoutes from './routes/checkouts.js';
import paymentRoutes from './routes/payments.js';

const app = express();

const allowedOriginsConfig = process.env.CORS_ORIGINS === '*'
  ? '*'
  : process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim());

const corsOptions = allowedOriginsConfig === '*'
  ? { origin: true, credentials: true }
  : { origin: allowedOriginsConfig, credentials: true };

app.use(cors({
  ...corsOptions,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-PAYMENT-RESPONSE'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
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
