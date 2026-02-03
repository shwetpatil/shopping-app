import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from '@shopping-app/common';
import { SERVICE_PORTS } from '@shopping-app/config';
import app from './app';
import { prisma } from './db/prisma';
import { initializeWebSocket } from './websocket';

dotenv.config();

const PORT = process.env.PORT || config.SERVICE_PORTS.PRODUCT;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Create HTTP server and initialize WebSocket
    const httpServer = createServer(app);
    initializeWebSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Product Service started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`WebSocket: ws://localhost:${PORT}/socket.io/`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
