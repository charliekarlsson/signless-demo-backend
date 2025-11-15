import dotenv from 'dotenv';

dotenv.config();

const stripPortAnnotations = (urlString) => (
  typeof urlString === 'string'
    ? urlString.replace(/:(\d+)\s*\([^)]*\)/, ':$1')
    : urlString
);

const sanitizePortInUrl = (urlString) => {
  if (!urlString) {
    return null;
  }

  const normalizedUrl = stripPortAnnotations(urlString);

  try {
    const parsed = new URL(normalizedUrl);

    if (!parsed.port) {
      return parsed.toString();
    }

    if (/^\d+$/.test(parsed.port)) {
      return parsed.toString();
    }

    const cleanedPort = parsed.port.replace(/\D/g, '');
    if (!cleanedPort) {
      return null;
    }

    parsed.port = cleanedPort;
    return parsed.toString();
  } catch (error) {
    return null;
  }
};

const sanitizePortVariable = (key) => {
  if (!process.env[key]) {
    return;
  }

  const cleaned = process.env[key].toString().replace(/\D/g, '');
  if (cleaned) {
    process.env[key] = cleaned;
  }
};

const pickEnv = (...keys) => keys.find((key) => process.env[key]);

const rebuildDatabaseUrlFromRailway = () => {
  const hostKey = pickEnv('PGHOST', 'POSTGRES_HOST');
  const portKey = pickEnv('PGPORT', 'POSTGRES_PORT');
  const userKey = pickEnv('PGUSER', 'POSTGRES_USER');
  const passwordKey = pickEnv('PGPASSWORD', 'POSTGRES_PASSWORD');
  const databaseKey = pickEnv('PGDATABASE', 'POSTGRES_DATABASE');

  if (!hostKey || !portKey || !userKey || !passwordKey || !databaseKey) {
    return null;
  }

  const rawPort = process.env[portKey] || '';
  const numericPort = rawPort.replace(/\D/g, '');

  if (!numericPort) {
    return null;
  }

  const username = encodeURIComponent(process.env[userKey]);
  const password = encodeURIComponent(process.env[passwordKey]);
  const host = process.env[hostKey];
  const database = process.env[databaseKey];
  const existingQuery = process.env.DATABASE_URL?.includes('?')
    ? process.env.DATABASE_URL.split('?')[1]
    : null;
  const query = existingQuery || 'sslmode=require&schema=public';

  return `postgresql://${username}:${password}@${host}:${numericPort}/${database}?${query}`;
};

const ensureValidDatabaseUrl = () => {
  const rebuilt = rebuildDatabaseUrlFromRailway();

  if (rebuilt) {
    process.env.DATABASE_URL = rebuilt;
    return;
  }

  const sanitizedUrl = sanitizePortInUrl(process.env.DATABASE_URL);

  if (sanitizedUrl) {
    process.env.DATABASE_URL = sanitizedUrl;
    return;
  }

  const fallbackUrl = sanitizePortInUrl(process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING);
  if (fallbackUrl) {
    process.env.DATABASE_URL = fallbackUrl;
  }
};

['PGPORT', 'POSTGRES_PORT'].forEach(sanitizePortVariable);

ensureValidDatabaseUrl();

const createModelStub = () => ({
  findUnique: async () => null,
  findFirst: async () => null,
  findMany: async () => [],
  create: async () => null,
  update: async () => null,
  delete: async () => null,
});

const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

let prisma;

if (isTestEnvironment) {
  prisma = {
    user: createModelStub(),
    merchant: createModelStub(),
    checkout: createModelStub(),
    apiKey: createModelStub(),
    payoutWallet: createModelStub(),
    merchantCompliance: createModelStub(),
    merchantDocument: createModelStub(),
    $connect: async () => {},
    $disconnect: async () => {},
  };
} else {
  const { PrismaClient } = await import('@prisma/client');
  const globalForPrisma = globalThis;

  prisma = globalForPrisma.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }
}

export default prisma;
