import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import app from './app';
import { redisClient } from './db/redis';

dotenv.config();

const PORT = process.env.PORT || 3004;

const startServer = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');

    app.listen(PORT, () => {
      logger.info(`Cart service listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  await redisClient.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
