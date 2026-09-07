import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/learnmate_db?schema=public';
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  JWT_SECRET: process.env.JWT_SECRET || 'learnmate_super_secret_jwt_access_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'learnmate_super_secret_jwt_refresh_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  DATABASE_URL: process.env.DATABASE_URL,

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  AI_PROVIDER: (process.env.AI_PROVIDER || 'mock') as 'openai' | 'gemini' | 'anthropic' | 'mock',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',

  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH || './uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isTest: (process.env.NODE_ENV || 'development') === 'test',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
};
