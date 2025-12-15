import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { errorHandler, requestLogger, requireAuth } from '@shopping-app/common';
import bffRoutes from './routes/bff.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  })
);

// Rate limiting - more aggressive for gateway
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// BFF routes (aggregated data)
app.use('/api/v1/bff', bffRoutes);

// Proxy routes to microservices

// Cart Service
app.use(
  '/api/v1/cart',
  requireAuth,
  createProxyMiddleware({
    target: process.env.CART_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/cart': '/api/cart',
    },
    onProxyReq: (proxyReq, req: any) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    },
  })
);

// Payment Service
app.use(
  '/api/v1/payments',
  requireAuth,
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/payments': '/api/payments',
    },
    onProxyReq: (proxyReq, req: any) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    },
  })
);

// Payment Webhooks (No auth required)
app.use(
  '/api/v1/webhooks',
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/webhooks': '/api/webhooks',
    },
  })
);

// Inventory Service
app.use(
  '/api/v1/inventory',
  requireAuth,
  createProxyMiddleware({
    target: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/inventory': '/api/inventory',
    },
    onProxyReq: (proxyReq, req: any) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    },
  })
);

// Notification Service
app.use(
  '/api/v1/notifications',
  requireAuth,
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/notifications': '/api/notifications',
    },
    onProxyReq: (proxyReq, req: any) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    },
  })
);

// Existing proxy routes
// Auth Service - No auth required for these endpoints
app.use(
  '/api/v1/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    pathRewrite: { '^/api/v1/auth': '/api/auth' },
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // Add correlation ID for tracing
      const correlationId = req.headers['x-correlation-id'] || `gw-${Date.now()}`;
      proxyReq.setHeader('x-correlation-id', correlationId);
    },
  })
);

// Product Service - Public endpoints
app.use(
  '/api/v1/products',
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    pathRewrite: { '^/api/v1/products': '/api/products' },
    changeOrigin: true,
  })
);

app.use(
  '/api/v1/categories',
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    pathRewrite: { '^/api/v1/categories': '/api/categories' },
    changeOrigin: true,
  })
);

app.use(
  '/api/v1/brands',
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    pathRewrite: { '^/api/v1/brands': '/api/brands' },
    changeOrigin: true,
  })
);

// Order Service - Protected endpoints
app.use(
  '/api/v1/orders',
  requireAuth,
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    pathRewrite: { '^/api/v1/orders': '/api/orders' },
    changeOrigin: true,
    onProxyReq: (proxyReq, req: any) => {
      // Forward auth header
      if (req.headers.authorization) {
        proxyReq.setHeader('authorization', req.headers.authorization);
      }
    },
  })
);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling
app.use(errorHandler);

export default app;
