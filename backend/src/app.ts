import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler.middleware';
import { sendSuccess } from './utils/response';

export const createApp = (): Application => {
  const app = express();

  // Basic security and utility middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: `${env.MAX_FILE_SIZE_MB}mb` }));
  app.use(express.urlencoded({ extended: true, limit: `${env.MAX_FILE_SIZE_MB}mb` }));

  // Request logger
  if (!env.isTest) {
    app.use(morgan('dev'));
  }

  // Rate limiter
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api/', limiter);

  // Static uploads directory
  app.use('/uploads', express.static(path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH)));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'LearnMate AI Backend Engine',
      version: '1.0.0',
    });
  });

  app.get('/api/v1', (_req: Request, res: Response) => {
    sendSuccess(res, {
      name: 'LearnMate AI API',
      version: 'v1',
      status: 'online',
    });
  });

  return app;
};
