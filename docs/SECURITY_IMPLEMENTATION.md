# Security Implementation Guide

## Overview

This guide shows how to implement the security features across all microservices in the shopping app.

## Table of Contents

1. [Authentication Setup](#authentication-setup)
2. [Rate Limiting](#rate-limiting)
3. [Input Sanitization](#input-sanitization)
4. [CORS Configuration](#cors-configuration)
5. [API Key Authentication](#api-key-authentication)
6. [Encryption](#encryption)
7. [Example Implementations](#example-implementations)

## Authentication Setup

### Basic Authentication Middleware

```typescript
import { requireAuth, requireRole } from '@shopping-app/common';

// Protect routes requiring authentication
app.use('/api/protected', requireAuth);

// Protect routes requiring specific roles
app.use('/api/admin', requireAuth, requireRole('ADMIN'));

// Multiple roles allowed
app.use('/api/products/manage', requireAuth, requireRole('ADMIN', 'VENDOR'));
```

### Token Blacklisting (Logout)

```typescript
import { blacklistToken } from '@shopping-app/common';

export const logout = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Get token expiry from JWT payload
    const payload = jwt.decode(token) as any;
    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
    
    // Blacklist for remaining lifetime
    await blacklistToken(token, expiresIn);
  }
  
  res.json({ message: 'Logged out successfully' });
};
```

## Rate Limiting

### Apply Different Limits by Route

```typescript
import {
  authRateLimit,
  apiRateLimit,
  readRateLimit,
  writeRateLimit,
} from '@shopping-app/common';

// Auth endpoints - strict limits
app.post('/auth/login', authRateLimit(), authController.login);
app.post('/auth/register', authRateLimit(), authController.register);

// Read endpoints - generous limits
app.get('/products', readRateLimit(), productController.list);
app.get('/products/:id', readRateLimit(), productController.get);

// Write endpoints - moderate limits
app.post('/products', writeRateLimit(), requireAuth, productController.create);
app.put('/products/:id', writeRateLimit(), requireAuth, productController.update);

// General API - standard limits
app.use('/api', apiRateLimit());
```

### Custom Rate Limit

```typescript
import { getRateLimiter } from '@shopping-app/common';

const customRateLimit = getRateLimiter().createMiddleware({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  maxRequests: 20,           // 20 requests
});

app.post('/api/expensive-operation', customRateLimit, handler);
```

## Input Sanitization

### Apply Sanitization Globally

```typescript
import {
  sanitize,
  securityHeaders,
  preventParameterPollution,
} from '@shopping-app/common';

// Apply all sanitization middleware
app.use(sanitize);

// Apply security headers (helmet)
app.use(securityHeaders);

// Prevent parameter pollution
app.use(preventParameterPollution);
```

### File Upload Security

```typescript
import { sanitizeFileUpload } from '@shopping-app/common';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

app.post('/api/upload',
  requireAuth,
  upload.single('file'),
  sanitizeFileUpload,
  uploadController.handle
);
```

## CORS Configuration

### Production CORS Setup

```typescript
import { createCorsMiddleware } from '@shopping-app/common';

// Production with whitelist
const corsMiddleware = createCorsMiddleware({
  whitelist: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://admin.yourdomain.com',
  ],
  allowAllOrigins: false,
});

app.use(corsMiddleware);
```

### Development CORS Setup

```typescript
import { devCors } from '@shopping-app/common';

// Development - allow all origins
if (process.env.NODE_ENV === 'development') {
  app.use(devCors);
}
```

## API Key Authentication

### Service-to-Service Communication

```typescript
import {
  requireApiKey,
  requireServiceAuth,
  generateApiKey,
} from '@shopping-app/common';

// Generate API key (run once per service)
const apiKey = generateApiKey();
console.log('API Key:', apiKey);
// Store in environment variable: API_KEYS=key1,key2,key3

// Protect internal endpoints
app.use('/internal', requireApiKey());

// Require both API key and service identification
app.use('/internal/inventory',
  requireServiceAuth({
    serviceName: 'inventory-service',
    allowedServices: ['order-service', 'cart-service'],
  })
);
```

### Making Authenticated Service Calls

```typescript
import axios from 'axios';
import { addServiceAuthHeaders } from '@shopping-app/common';

const inventoryClient = axios.create({
  baseURL: 'http://inventory-service:3000',
});

// Add interceptor for authentication
inventoryClient.interceptors.request.use(
  addServiceAuthHeaders('order-service', process.env.API_KEY!)
);

// All requests now include X-API-Key and X-Service-Name headers
const response = await inventoryClient.post('/internal/reserve', data);
```

## Encryption

### Encrypt Sensitive Data

```typescript
import {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  encryptFields,
  decryptFields,
  maskString,
} from '@shopping-app/common';

// Encrypt strings
const encryptedSSN = encrypt('123-45-6789');
const originalSSN = decrypt(encryptedSSN);

// Encrypt entire objects
const user = { email: 'user@example.com', ssn: '123-45-6789' };
const encryptedUser = encryptObject(user);
const decryptedUser = decryptObject<typeof user>(encryptedUser);

// Encrypt specific fields
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  ssn: '123-45-6789',
  creditCard: '4532-1234-5678-9010',
};

const encrypted = encryptFields(userData, ['ssn', 'creditCard']);
// Save to database

const dbUser = await prisma.user.findUnique({ where: { id } });
const decrypted = decryptFields(dbUser, ['ssn', 'creditCard']);
// Use decrypted data

// Mask sensitive data for logs/display
const maskedCard = maskString('4532-1234-5678-9010', 4); // ************9010
const maskedPhone = maskString('555-123-4567', 4);        // *********4567
```

## Example Implementations

### Auth Service

```typescript
import express from 'express';
import {
  authRateLimit,
  sanitize,
  securityHeaders,
  corsMiddleware,
  requireAuth,
} from '@shopping-app/common';

const app = express();

// Global middleware
app.use(express.json());
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(sanitize);

// Auth routes with rate limiting
app.post('/auth/register', authRateLimit(), authController.register);
app.post('/auth/login', authRateLimit(), authController.login);
app.post('/auth/refresh', authRateLimit(), authController.refresh);
app.post('/auth/logout', requireAuth, authController.logout);

// Protected routes
app.get('/auth/me', requireAuth, authController.getProfile);
app.patch('/auth/me', requireAuth, authController.updateProfile);
```

### Product Service

```typescript
import express from 'express';
import {
  readRateLimit,
  writeRateLimit,
  requireAuth,
  requireRole,
  sanitize,
  securityHeaders,
  corsMiddleware,
} from '@shopping-app/common';

const app = express();

// Global middleware
app.use(express.json());
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(sanitize);

// Public read endpoints
app.get('/products', readRateLimit(), productController.list);
app.get('/products/:id', readRateLimit(), productController.get);

// Protected write endpoints
app.post('/products',
  writeRateLimit(),
  requireAuth,
  requireRole('ADMIN', 'VENDOR'),
  productController.create
);

app.put('/products/:id',
  writeRateLimit(),
  requireAuth,
  requireRole('ADMIN', 'VENDOR'),
  productController.update
);

app.delete('/products/:id',
  writeRateLimit(),
  requireAuth,
  requireRole('ADMIN'),
  productController.delete
);
```

### Order Service

```typescript
import express from 'express';
import axios from 'axios';
import {
  apiRateLimit,
  writeRateLimit,
  requireAuth,
  requireApiKey,
  addServiceAuthHeaders,
  sanitize,
  securityHeaders,
  corsMiddleware,
} from '@shopping-app/common';

const app = express();

// Global middleware
app.use(express.json());
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(sanitize);

// Public endpoints
app.get('/orders',
  apiRateLimit(),
  requireAuth,
  orderController.list
);

app.post('/orders',
  writeRateLimit(),
  requireAuth,
  orderController.create
);

// Internal service-to-service endpoints
app.post('/internal/orders/status',
  requireApiKey(),
  orderController.updateStatus
);

// Inventory service client with authentication
const inventoryClient = axios.create({
  baseURL: process.env.INVENTORY_SERVICE_URL,
});

inventoryClient.interceptors.request.use(
  addServiceAuthHeaders('order-service', process.env.API_KEY!)
);

// Use authenticated client
const reserveStock = async (items: OrderItem[]) => {
  const response = await inventoryClient.post('/internal/reserve', { items });
  return response.data;
};
```

### API Gateway

```typescript
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import {
  apiRateLimit,
  requireAuth,
  optionalAuth,
  sanitize,
  securityHeaders,
  strictCors,
} from '@shopping-app/common';

const app = express();

// Global security middleware
app.use(securityHeaders);
app.use(strictCors); // Production CORS
app.use(sanitize);
app.use(apiRateLimit());

// Public routes (no auth required)
app.use('/api/products', createProxyMiddleware({
  target: 'http://product-service:3000',
  changeOrigin: true,
}));

// Protected routes (auth required)
app.use('/api/orders',
  requireAuth,
  createProxyMiddleware({
    target: 'http://order-service:3000',
    changeOrigin: true,
  })
);

app.use('/api/cart',
  requireAuth,
  createProxyMiddleware({
    target: 'http://cart-service:3000',
    changeOrigin: true,
  })
);

// Admin routes (admin role required)
app.use('/api/admin',
  requireAuth,
  requireRole('ADMIN'),
  createProxyMiddleware({
    target: 'http://admin-service:3000',
    changeOrigin: true,
  })
);
```

## Environment Variables

### Required Security Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Redis (for rate limiting and token blacklist)
REDIS_URL=redis://localhost:6379

# Encryption
ENCRYPTION_KEY=your-encryption-key-min-32-characters

# CORS
CORS_WHITELIST=https://yourdomain.com,https://www.yourdomain.com
CORS_ALLOW_ALL=false

# API Keys (comma-separated)
API_KEYS=key1-hash,key2-hash,key3-hash

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Security
NODE_ENV=production
BCRYPT_ROUNDS=10
```

### Generating Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Testing Security

### Test Rate Limiting

```bash
# Test login rate limit (should block after 5 attempts)
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
done
```

### Test Authentication

```bash
# Test without token (should return 401)
curl -X GET http://localhost:3000/api/orders

# Test with invalid token (should return 401)
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer invalid-token"

# Test with valid token (should return 200)
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

### Test Input Sanitization

```bash
# Test XSS protection
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"<script>alert('xss')</script>"}'
  
# Response should have sanitized name
```

### Test CORS

```bash
# Test from disallowed origin (should be blocked)
curl -X GET http://localhost:3000/api/products \
  -H "Origin: https://evil.com"

# Test from allowed origin (should work)
curl -X GET http://localhost:3000/api/products \
  -H "Origin: https://yourdomain.com"
```

## Security Checklist

Before deploying to production, verify:

- [ ] All secrets in environment variables (not in code)
- [ ] HTTPS/TLS configured and enforced
- [ ] Rate limiting enabled on all routes
- [ ] Authentication required on protected routes
- [ ] Authorization checks on all sensitive operations
- [ ] Input sanitization enabled globally
- [ ] CORS configured with whitelist
- [ ] Security headers applied (helmet)
- [ ] Sensitive data encrypted at rest
- [ ] Token blacklisting working (test logout)
- [ ] API keys generated for service-to-service calls
- [ ] Logging configured (no sensitive data)
- [ ] Error messages don't expose internals
- [ ] Dependencies updated (npm audit clean)
- [ ] Security tests passing
- [ ] Monitoring and alerts configured

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
