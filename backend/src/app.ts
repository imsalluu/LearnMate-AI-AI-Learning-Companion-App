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
import { authRoutes } from './modules/auth/auth.routes';
import { userRoutes } from './modules/users/user.routes';
import { materialRoutes } from './modules/materials/material.routes';
import { conversationRoutes } from './modules/conversations/conversation.routes';
import { tutorRoutes } from './modules/tutor/tutor.routes';
import { quizRoutes } from './modules/quizzes/quiz.routes';
import { flashcardRoutes } from './modules/flashcards/flashcard.routes';
import { studyPlanRoutes } from './modules/study-plans/study-plan.routes';

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

  // Domain API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/materials', materialRoutes);
  app.use('/api/v1/conversations', conversationRoutes);
  app.use('/api/v1/tutor', tutorRoutes);
  app.use('/api/v1/quizzes', quizRoutes);
  app.use('/api/v1/flashcards', flashcardRoutes);
  app.use('/api/v1/study-plans', studyPlanRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
