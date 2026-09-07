import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.isDev ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info(' Connected to PostgreSQL database');
  } catch (error) {
    logger.warn(' PostgreSQL connection failed (running in test/fallback mode):', (error as Error).message);
  }
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
}
