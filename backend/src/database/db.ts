import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var isPostgresConnected: boolean | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.isDev && !env.isTest ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

let dbAvailable = false;

export function isDbAvailable(): boolean {
  return dbAvailable;
}

export function setDbAvailable(available: boolean): void {
  dbAvailable = available;
}

export async function connectDB(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
    logger.info(' Connected to PostgreSQL database');
    return true;
  } catch (error) {
    dbAvailable = false;
    logger.warn(' PostgreSQL connection failed (running in test/fallback mode):', (error as Error).message);
    return false;
  }
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  dbAvailable = false;
}
