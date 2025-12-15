import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`API Gateway listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info('Service routes:');
      logger.info(`  Auth:    ${process.env.AUTH_SERVICE_URL}`);
      logger.info(`  Product: ${process.env.PRODUCT_SERVICE_URL}`);
      logger.info(`  Order:   ${process.env.ORDER_SERVICE_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

startServer();
