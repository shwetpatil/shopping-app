import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import app from './app';
import { prisma } from './db/prisma';
import { kafkaClient } from './events/kafka';

dotenv.config();

import { SERVICE_PORTS } from '@shopping-app/config';

const PORT = process.env.PORT || config.SERVICE_PORTS.ORDER;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Connect to Kafka
    await kafkaClient.connectProducer();
    logger.info('Kafka producer connected');

    app.listen(PORT, () => {
      logger.info(`📦 Order Service started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  await kafkaClient.disconnectAll();
  await prisma.$disconnect();
  
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
