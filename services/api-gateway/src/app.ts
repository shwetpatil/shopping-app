import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { errorHandler, requestLogger, requireAuth } from '@shopping-app/common';
import { MFE_URLS, SERVICE_URLS } from '@shopping-app/config';
import bffRoutes from './routes/bff.routes';
import { setupGraphQL } from './graphql';

const app: Application = express();

// Default CORS origins from config
const DEFAULT_CORS_ORIGINS = [MFE_URLS.SHELL, MFE_URLS.PRODUCTS];

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || DEFAULT_CORS_ORIGINS,
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

app.use(limiter as any);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger as any);

// Initialize GraphQL - exported function called from server.ts
export const initializeGraphQL = async () => {
  await setupGraphQL(app);
};

// Health check
app.get('/health', (_req: Request, res: Response) => {
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
  requireAuth as any,
  createProxyMiddleware({
    target: process.env.CART_SERVICE_URL || SERVICE_URLS.CART,
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
  requireAuth as any,
  createProxyMiddleware({
    target: process.env.PAYMENT_SERVICE_URL || SERVICE_URLS.PAYMENT,
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
    target: process.env.PAYMENT_SERVICE_URL || SERVICE_URLS.PAYMENT,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/webhooks': '/api/webhooks',
    },
  })
);

// Inventory Service
app.use(
  '/api/v1/inventory',
  requireAuth as any,
  createProxyMiddleware({
    target: process.env.INVENTORY_SERVICE_URL || SERVICE_URLS.INVENTORY,
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
  requireAuth as any,
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || SERVICE_URLS.NOTIFICATION,
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
    target: process.env.AUTH_SERVICE_URL || SERVICE_URLS.AUTH,
    pathRewrite: { '^/api/v1/auth': '/api/auth' },
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      // Add correlation ID for tracing
      const correlationId = req.headers['x-correlation-id'] || `gw-${Date.now()}`;
      proxyReq.setHeader('x-correlation-id', String(correlationId));
    },
  })
);

// Response caching for GET requests
import { responseCacheMiddleware } from './middleware/response-cache.middleware';

// Product Service - Public endpoints with response caching
app.use(
  '/api/v1/products',
  responseCacheMiddleware({ ttl: 300 }), // 5 min cache
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT,
    pathRewrite: { '^/api/v1/products': '/api/products' },
    changeOrigin: true,
  })
);

app.use(
  '/api/v1/categories',
  responseCacheMiddleware({ ttl: 3600 }), // 1 hour cache
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT,
    pathRewrite: { '^/api/v1/categories': '/api/categories' },
    changeOrigin: true,
  })
);

app.use(
  '/api/v1/brands',
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT,
    pathRewrite: { '^/api/v1/brands': '/api/brands' },
    changeOrigin: true,
  })
);

// Order Service - Protected endpoints
app.use(
  '/api/v1/orders',
  requireAuth as any,
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || SERVICE_URLS.ORDER,
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
app.use(errorHandler as any);

export default app;
