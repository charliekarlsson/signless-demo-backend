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
