import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import { SERVICE_PORTS } from '@shopping-app/config';
import app, { initializeGraphQL } from './app';

dotenv.config();

const PORT = process.env.PORT || config.SERVICE_PORTS.API_GATEWAY;

const startServer = async () => {
  try {
    // Initialize GraphQL before starting the server
    await initializeGraphQL();
    
    app.listen(PORT, () => {
      logger.info(`🚀 API Gateway started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info('Service routes:');
      logger.info(`  Auth:    ${process.env.AUTH_SERVICE_URL || config.SERVICE_URLS.AUTH}`);
      logger.info(`  Product: ${process.env.PRODUCT_SERVICE_URL || config.SERVICE_URLS.PRODUCT}`);
      logger.info(`  Order:   ${process.env.ORDER_SERVICE_URL || config.SERVICE_URLS.ORDER}`);
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
