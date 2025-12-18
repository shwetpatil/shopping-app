import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '@shopping-app/common';

let io: SocketIOServer | null = null;

export const initializeWebSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3004'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io/',
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Allow clients to subscribe to specific product updates
    socket.on('subscribe:product', (productId: string) => {
      socket.join(`product:${productId}`);
      logger.info(`Client ${socket.id} subscribed to product ${productId}`);
    });

    socket.on('unsubscribe:product', (productId: string) => {
      socket.leave(`product:${productId}`);
      logger.info(`Client ${socket.id} unsubscribed from product ${productId}`);
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeWebSocket first.');
  }
  return io;
};

// Emit inventory update to all connected clients
export const emitInventoryUpdate = (productId: string, stock: number) => {
  if (io) {
    io.to(`product:${productId}`).emit('inventory:update', {
      productId,
      stock,
      timestamp: new Date().toISOString(),
    });
    logger.info(`Emitted inventory update for product ${productId}: ${stock}`);
  }
};

// Emit product update (price, details, etc.)
export const emitProductUpdate = (productId: string, updates: any) => {
  if (io) {
    io.to(`product:${productId}`).emit('product:update', {
      productId,
      updates,
      timestamp: new Date().toISOString(),
    });
    logger.info(`Emitted product update for ${productId}`);
  }
};

// Broadcast to all clients (e.g., new product added)
export const broadcastProductEvent = (event: string, data: any) => {
  if (io) {
    io.emit(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    logger.info(`Broadcasted event: ${event}`);
  }
};
