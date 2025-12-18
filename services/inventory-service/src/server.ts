import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import app from './app';
import { prisma } from './db/prisma';
import { kafkaClient } from './events/kafka';
import { OrderEventConsumer } from './consumers/order-event.consumer';
import { PaymentEventConsumer } from './consumers/payment-event.consumer';
import { ReservationCleanupJob } from './jobs/reservation-cleanup.job';

dotenv.config();

import { SERVICE_PORTS } from '@shopping-app/config';

const PORT = process.env.PORT || SERVICE_PORTS.INVENTORY;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    await kafkaClient.connectProducer();
    logger.info('Kafka producer connected');

    const orderEventConsumer = new OrderEventConsumer();
    await orderEventConsumer.start();

    const paymentEventConsumer = new PaymentEventConsumer();
    await paymentEventConsumer.start();

    logger.info('Kafka consumers started');

    const cleanupJob = new ReservationCleanupJob();
    cleanupJob.start();
    logger.info('Reservation cleanup job started');

    app.listen(PORT, () => {
      logger.info(`📊 Inventory Service started on port ${PORT}`);
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
  await prisma.$disconnect();
  await kafkaClient.disconnectAll();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
