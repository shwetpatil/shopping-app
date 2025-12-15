import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import app from './app';
import { prisma } from './db/prisma';
import { kafkaClient } from './events/kafka';

dotenv.config();

const PORT = process.env.PORT || 3003;

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Connect to Kafka
    await kafkaClient.connectProducer();
    logger.info('Kafka producer connected');

    app.listen(PORT, () => {
      logger.info(`Order service listening on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
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
