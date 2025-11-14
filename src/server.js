import dotenv from 'dotenv';
import app from './app.js';
import prisma from './lib/prisma.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`🚀 X4ZERO backend listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

export default app;
