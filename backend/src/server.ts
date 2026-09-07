import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 LearnMate AI Backend running on http://${env.HOST}:${env.PORT}`);
  logger.info(`🌐 Environment: ${env.NODE_ENV}`);
  logger.info(`🤖 AI Provider: ${env.AI_PROVIDER}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

export default server;
