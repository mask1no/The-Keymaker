import 'server-only'; let PrismaClientRef: any = null;
try { // Lazy optional import to avoid crashing when @prisma/client is not installed // eslint-disable-next-line @typescript-eslint/no-var-requires PrismaClientRef = require('@prisma/client').PrismaClient;
} catch { PrismaClientRef = null;
} let prisma: any | null = null; export function getPrisma(): any | null { if (!process.env.DATABASE_URL) return null; if (!PrismaClientRef) return null; if (!prisma) { prisma = new PrismaClientRef(); } return prisma;
}
