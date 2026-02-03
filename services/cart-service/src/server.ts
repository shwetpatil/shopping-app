import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import app from './app';
import { redisClient } from './db/redis';

dotenv.config();

import { SERVICE_PORTS } from '@shopping-app/config';

const PORT = process.env.PORT || config.SERVICE_PORTS.CART;

const startServer = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');

    app.listen(PORT, () => {
      logger.info(`🛒 Cart Service started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
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
