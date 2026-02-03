import dotenv from 'dotenv';
import { logger } from '@shopping-app/common';
import app from './app';
import { prisma } from './db/prisma';
import { kafkaClient } from './events/kafka';
import { OrderEventConsumer } from './consumers/order-event.consumer';
import { PaymentEventConsumer } from './consumers/payment-event.consumer';
import { InventoryEventConsumer } from './consumers/inventory-event.consumer';

dotenv.config();

import { SERVICE_PORTS } from '@shopping-app/config';

const PORT = process.env.PORT || config.SERVICE_PORTS.NOTIFICATION;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    const orderEventConsumer = new OrderEventConsumer();
    await orderEventConsumer.start();

    const paymentEventConsumer = new PaymentEventConsumer();
    await paymentEventConsumer.start();

    const inventoryEventConsumer = new InventoryEventConsumer();
    await inventoryEventConsumer.start();

    logger.info('Kafka consumers started');

    app.listen(PORT, () => {
      logger.info(`🔔 Notification Service started on port ${PORT}`);
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
