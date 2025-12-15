# Backend Microservices Best Practices (Phase 2)

> **Purpose**: Best practices for building, deploying, and maintaining backend microservices in our e-commerce platform.

## Table of Contents

1. [Microservices Architecture Patterns](#microservices-architecture-patterns)
2. [Event-Driven Communication](#event-driven-communication)
3. [Data Management](#data-management)
4. [API Design](#api-design)
5. [Resilience & Fault Tolerance](#resilience--fault-tolerance)
6. [Security](#security)
7. [Observability & Monitoring](#observability--monitoring)
8. [Testing Strategies](#testing-strategies)
9. [Deployment & DevOps](#deployment--devops)
10. [Performance Optimization](#performance-optimization)

---

## Microservices Architecture Patterns

### 1. Database Per Service Pattern ✅

**Why**: Each service owns its data. No shared databases. Prevents tight coupling.

**Implementation**:
```typescript
// ✅ Good: Each service has its own database
services/
├── order-service/
│   └── prisma/schema.prisma      # order_db
├── payment-service/
│   └── prisma/schema.prisma      # payment_db
├── inventory-service/
│   └── prisma/schema.prisma      # inventory_db
```

**Rules**:
- ❌ Never access another service's database directly
- ✅ Use APIs or events to get data from other services
- ✅ Accept data duplication when necessary
- ✅ Each service can use different database technology if needed

**Example - Order Service needs Product Info**:
```typescript
// ❌ BAD: Direct database access
const product = await productDb.product.findUnique({ id });

// ✅ GOOD: API call
const product = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`);

// ✅ BETTER: Cache product data in order
const order = await prisma.order.create({
  data: {
    items: [{
      productId: product.id,
      productName: product.name,  // Denormalized
      price: product.price,        // Snapshot at time of order
    }],
  },
});
```

**Benefits**:
- Independent scaling (order DB can be bigger than payment DB)
- Independent schema evolution
- Fault isolation (product DB down doesn't break orders)
- Technology flexibility

### 2. API Gateway Pattern ✅

**Why**: Single entry point for clients. Handles cross-cutting concerns (auth, rate limiting, logging).

**Implementation**:
```typescript
// services/api-gateway/src/app.ts
import { createProxyMiddleware } from 'http-proxy-middleware';

// Authentication middleware
app.use('/api/*', authenticateJWT);

// Rate limiting
app.use('/api/orders', orderRateLimit);
app.use('/api/payments', paymentRateLimit);

// Route to services
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  pathRewrite: { '^/api/auth': '/api' },
}));

app.use('/api/orders', createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL,
  pathRewrite: { '^/api/orders': '/api/orders' },
}));
```

**What Gateway Does**:
- ✅ JWT authentication (verify token once)
- ✅ Rate limiting per endpoint
- ✅ Request/response logging
- ✅ CORS handling
- ✅ Request aggregation (BFF pattern)
- ✅ API versioning
- ✅ Error standardization

**BFF (Backend for Frontend) Pattern**:
```typescript
// Aggregate data from multiple services
router.get('/api/bff/product/:id/complete', async (req, res) => {
  const [product, inventory, reviews] = await Promise.all([
    productService.get(id),
    inventoryService.getStock(id),
    reviewService.getReviews(id),
  ]);
  
  res.json({
    product,
    inStock: inventory.quantity > 0,
    rating: reviews.averageRating,
  });
});
```

### 3. Service Discovery

**Current**: Static configuration with environment variables
**Future**: Consider service registry (Consul, Eureka) for dynamic discovery

```typescript
// Current approach
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Future with service registry
const productService = await serviceRegistry.discover('product-service');
const url = productService.getHealthyInstance().url;
```

---

## Event-Driven Communication

### 4. Saga Pattern for Distributed Transactions ✅

**Why**: No distributed transactions (ACID) across services. Use sagas for eventual consistency.

**Types of Sagas**:

#### Choreography (Current Implementation) ✅
Services react to events, no central coordinator.

```typescript
// Order Service
async createOrder(data) {
  const order = await prisma.order.create({
    data: { ...data, status: 'PENDING' },
  });
  
  // Publish event
  await eventBus.publish('orders', {
    type: EventType.ORDER_CREATED,
    orderId: order.id,
    items: order.items,
  });
  
  return order;
}

// Inventory Service (listens)
eventBus.subscribe(['orders'], async (message) => {
  if (message.value.type === 'ORDER_CREATED') {
    await reserveStock(message.value.items);
    await eventBus.publish('inventory', {
      type: EventType.STOCK_RESERVED,
      orderId: message.value.orderId,
    });
  }
});

// Order Service (listens for confirmation)
eventBus.subscribe(['inventory', 'payments'], async (message) => {
  if (message.value.type === 'STOCK_RESERVED' &&
      message.value.type === 'PAYMENT_AUTHORIZED') {
    await updateOrderStatus(orderId, 'CONFIRMED');
  }
});
```

#### Orchestration (Recommended for Complex Flows)
Central coordinator manages saga execution.

```typescript
class OrderSagaOrchestrator {
  async execute(orderId: string) {
    const saga = await this.createSaga(orderId);
    
    try {
      // Step 1: Reserve inventory
      await this.reserveInventory(saga);
      await this.updateSagaStep(saga.id, 'INVENTORY_RESERVED');
      
      // Step 2: Authorize payment
      await this.authorizePayment(saga);
      await this.updateSagaStep(saga.id, 'PAYMENT_AUTHORIZED');
      
      // Step 3: Confirm order
      await this.confirmOrder(saga);
      await this.completeSaga(saga.id);
      
    } catch (error) {
      // Compensating transactions (rollback)
      await this.compensate(saga);
    }
  }
  
  private async compensate(saga: Saga) {
    if (saga.step >= 'PAYMENT_AUTHORIZED') {
      await this.refundPayment(saga.orderId);
    }
    if (saga.step >= 'INVENTORY_RESERVED') {
      await this.releaseInventory(saga.orderId);
    }
    await this.cancelOrder(saga.orderId);
  }
}
```

**Saga State Storage**:
```prisma
model Saga {
  id            String   @id @default(uuid())
  orderId       String   @unique
  status        String   // PENDING, COMPLETED, FAILED, COMPENSATING
  currentStep   String
  data          Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 5. Event Sourcing (Future Consideration)

Store all changes as events, rebuild state by replaying events.

```typescript
// Event store
interface OrderEvent {
  id: string;
  aggregateId: string;  // orderId
  type: 'OrderCreated' | 'OrderPaid' | 'OrderShipped';
  data: any;
  version: number;
  timestamp: Date;
}

// Rebuild order state
function replayEvents(events: OrderEvent[]): Order {
  return events.reduce((order, event) => {
    switch (event.type) {
      case 'OrderCreated':
        return { ...event.data, status: 'PENDING' };
      case 'OrderPaid':
        return { ...order, status: 'PAID', paymentId: event.data.paymentId };
      case 'OrderShipped':
        return { ...order, status: 'SHIPPED', trackingNumber: event.data.trackingNumber };
    }
  }, {} as Order);
}
```

**Benefits**:
- Complete audit trail
- Time travel (see order at any point)
- Event replay for debugging
- Build new read models from events

### 6. Event Versioning

**Why**: Events are a contract. Breaking changes need versioning.

```typescript
// v1 - Original
interface OrderCreatedV1 {
  type: 'order.created.v1';
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

// v2 - Added customer info
interface OrderCreatedV2 {
  type: 'order.created.v2';
  orderId: string;
  customerId: string;  // New field
  items: Array<{ 
    productId: string; 
    quantity: number;
    price: number;  // New field
  }>;
}

// Handler supports both versions
eventBus.subscribe(['orders'], async (message) => {
  const event = message.value;
  
  if (event.type === 'order.created.v1') {
    await handleOrderCreatedV1(event as OrderCreatedV1);
  } else if (event.type === 'order.created.v2') {
    await handleOrderCreatedV2(event as OrderCreatedV2);
  }
});
```

### 7. Idempotency

**Why**: Events may be delivered multiple times. Handle duplicates.

```typescript
// Payment Service - Idempotency
interface IdempotencyLog {
  id: string;
  key: string;        // Unique key from request
  requestHash: string;
  response: Json;
  createdAt: DateTime;
}

async function processPayment(orderId: string, idempotencyKey: string) {
  // Check if already processed
  const existing = await prisma.idempotencyLog.findUnique({
    where: { key: idempotencyKey },
  });
  
  if (existing) {
    logger.info('Idempotent request detected', { key: idempotencyKey });
    return existing.response;  // Return cached response
  }
  
  // Process payment
  const result = await stripe.paymentIntents.create({...});
  
  // Store for future idempotency checks
  await prisma.idempotencyLog.create({
    data: {
      key: idempotencyKey,
      requestHash: hash(orderId),
      response: result,
    },
  });
  
  return result;
}
```

---

## Data Management

### 8. Data Consistency Patterns

#### Strong Consistency (Within Service)
Use database transactions for operations within same service.

```typescript
// Order Service - Atomic operation
async createOrder(data: CreateOrderDTO) {
  return await prisma.$transaction(async (tx) => {
    // Create order
    const order = await tx.order.create({ data });
    
    // Create order items
    await tx.orderItem.createMany({
      data: data.items.map(item => ({
        orderId: order.id,
        ...item,
      })),
    });
    
    // Record status history
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        notes: 'Order created',
      },
    });
    
    return order;
  });
}
```

#### Eventual Consistency (Across Services)
Use events and accept temporary inconsistency.

```typescript
// Order created with PENDING status
// → Event published
// → Inventory service reserves stock (eventually)
// → Order status updated to CONFIRMED (eventually)

// Read-your-writes consistency
async getOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  
  // Poll for status changes if recent
  if (Date.now() - order.createdAt.getTime() < 5000) {
    // Might still be processing, show "Processing..." to user
    return { ...order, processing: true };
  }
  
  return order;
}
```

### 9. Caching Strategy ✅

**Redis for Distributed Caching**:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache product data (rarely changes)
async function getProduct(id: string): Promise<Product> {
  const cacheKey = `product:${id}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info('Cache hit', { key: cacheKey });
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const product = await prisma.product.findUnique({ where: { id } });
  
  // Store in cache (24 hours)
  await redis.setex(cacheKey, 86400, JSON.stringify(product));
  
  return product;
}

// Invalidate cache on update
async function updateProduct(id: string, data: UpdateProductDTO) {
  const product = await prisma.product.update({
    where: { id },
    data,
  });
  
  // Invalidate cache
  await redis.del(`product:${id}`);
  
  return product;
}
```

**Cache-Aside Pattern** (Read-through cache):
1. Check cache
2. If miss, fetch from DB
3. Store in cache
4. Return data

**Write-Through Pattern**:
1. Write to database
2. Write to cache
3. Return success

**Cache Invalidation Strategies**:
- **TTL-based**: Set expiration time
- **Event-based**: Listen to update events and invalidate
- **Pattern-based**: Invalidate all keys matching pattern

```typescript
// Invalidate all product caches
await redis.del(await redis.keys('product:*'));
```

---

## API Design

### 10. RESTful API Best Practices ✅

**Resource Naming**:
```typescript
// ✅ Good
GET    /api/orders           // List orders
GET    /api/orders/:id       // Get specific order
POST   /api/orders           // Create order
PATCH  /api/orders/:id       // Update order
DELETE /api/orders/:id       // Delete order

// ❌ Bad
GET    /api/getOrders
POST   /api/createOrder
GET    /api/order/:id/get
```

**Versioning**:
```typescript
// URL versioning (recommended)
app.use('/api/v1/orders', ordersV1Router);
app.use('/api/v2/orders', ordersV2Router);

// Header versioning
app.use((req, res, next) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
});
```

**Pagination**:
```typescript
// services/order-service/src/controllers/order.controller.ts
async getOrders(req: Request, res: Response) {
  const { page = 1, limit = 10, status } = req.query;
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user!.id, status },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({
      where: { userId: req.user!.id, status },
    }),
  ]);
  
  res.json({
    success: true,
    data: orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
      hasNext: skip + orders.length < total,
      hasPrev: Number(page) > 1,
    },
  });
}
```

**Filtering & Sorting**:
```typescript
// GET /api/orders?status=PENDING&sortBy=createdAt&order=desc
const { status, sortBy = 'createdAt', order = 'desc' } = req.query;

const orders = await prisma.order.findMany({
  where: { status: status as OrderStatus },
  orderBy: { [sortBy as string]: order },
});
```

**Standard Response Format**:
```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Order created successfully"
}

// Error response
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Product out of stock",
    "details": {
      "productId": "123",
      "available": 0,
      "requested": 5
    }
  }
}
```

### 11. Input Validation ✅

**Zod for Runtime Validation**:

```typescript
import { z } from 'zod';

// services/order-service/src/validators/order.validator.ts
const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(50),
  
  shippingAddress: z.object({
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(3),
  }),
  
  shippingMethod: z.enum(['standard', 'express', 'overnight']),
  notes: z.string().max(500).optional(),
});

// Middleware
export function validateCreateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    req.body = CreateOrderSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }
    next(error);
  }
}

// Usage
router.post('/orders', validateCreateOrder, orderController.createOrder);
```

---

## Resilience & Fault Tolerance

### 12. Circuit Breaker Pattern

**Why**: Prevent cascading failures. Stop calling failing service temporarily.

```typescript
// packages/common/src/patterns/circuit-breaker.ts
enum CircuitState {
  CLOSED,   // Normal operation
  OPEN,     // Failing, reject requests
  HALF_OPEN // Testing if service recovered
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  
  constructor(
    private threshold: number = 5,      // Failures before opening
    private timeout: number = 60000,    // Time before retry (ms)
    private resetTimeout: number = 30000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        logger.info('Circuit half-open, testing service');
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      logger.info('Circuit closed, service recovered');
    }
  }
  
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
      logger.error('Circuit opened due to failures', {
        failures: this.failureCount,
      });
    }
  }
}

// Usage
const productServiceCircuit = new CircuitBreaker();

async function fetchProduct(id: string) {
  return await productServiceCircuit.execute(async () => {
    return await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`);
  });
}
```

### 13. Retry Logic with Exponential Backoff ✅

```typescript
// packages/common/src/utils/retry.ts
interface RetryOptions {
  attempts: number;
  delay: number;
  backoff: number;
  onRetry?: (attempt: number, error: Error) => void;
}

async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.attempts) {
        break;  // Last attempt, throw error
      }
      
      const delay = options.delay * Math.pow(options.backoff, attempt - 1);
      
      options.onRetry?.(attempt, lastError);
      logger.warn('Retry attempt', { attempt, delay, error: lastError.message });
      
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

// Usage
const product = await retry(
  () => axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`),
  {
    attempts: 3,
    delay: 1000,    // 1s
    backoff: 2,     // 1s, 2s, 4s
    onRetry: (attempt) => {
      logger.info('Retrying product fetch', { attempt });
    },
  }
);
```

### 14. Timeouts

**Always set timeouts for external calls**:

```typescript
// HTTP client with timeout
const axios = require('axios').create({
  timeout: 5000,  // 5 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Database query timeout
await prisma.order.findMany({
  take: 100,
  timeout: 10000,  // 10 seconds
});

// Kafka consumer timeout
await consumer.run({
  eachMessage: async ({ message }) => {
    const timeout = setTimeout(() => {
      throw new Error('Message processing timeout');
    }, 30000);  // 30 seconds
    
    try {
      await processMessage(message);
    } finally {
      clearTimeout(timeout);
    }
  },
});
```

### 15. Graceful Degradation

**Fallback to cached/default values when service unavailable**:

```typescript
async function getProductWithFallback(id: string): Promise<Product> {
  try {
    // Try fetching from service
    return await fetchProduct(id);
  } catch (error) {
    logger.warn('Product service unavailable, using cache', { id });
    
    // Try cache
    const cached = await redis.get(`product:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Return minimal product data
    return {
      id,
      name: 'Product Unavailable',
      price: 0,
      inStock: false,
      description: 'Product information temporarily unavailable',
    };
  }
}
```

---

## Security

### 16. API Security Best Practices ✅

**Rate Limiting** (Already Implemented):
```typescript
// services/api-gateway/src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,  // 100 requests per minute
  skip: (req) => req.path === '/health',  // Skip health checks
});
```

**Input Sanitization**:
```typescript
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

function sanitizeInput(input: string): string {
  // Remove HTML tags
  let sanitized = DOMPurify.sanitize(input);
  
  // Escape SQL special characters
  sanitized = validator.escape(sanitized);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  return sanitized.trim();
}
```

**SQL Injection Protection** (Prisma handles this):
```typescript
// ✅ Safe: Prisma uses parameterized queries
await prisma.user.findUnique({
  where: { email: userInput },
});

// ❌ Dangerous: Raw SQL without parameterization
await prisma.$queryRaw`SELECT * FROM users WHERE email = '${userInput}'`;

// ✅ Safe: Raw SQL with parameterization
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`;
```

**CORS Configuration**:
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 600,  // 10 minutes
}));
```

**Helmet for Security Headers**:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 17. Secrets Management

**Never commit secrets to git**:

```bash
# .env.example (commit this)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_...

# .env (never commit this)
DATABASE_URL=postgresql://prod_user:REAL_PASSWORD@db.example.com:5432/prod_db
JWT_SECRET=super-secret-production-key-abc123xyz
STRIPE_SECRET_KEY=sk_live_REAL_SECRET_KEY
```

**Use environment-specific secrets**:
```typescript
const config = {
  development: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    stripeKey: process.env.STRIPE_SECRET_KEY || 'sk_test_...',
  },
  production: {
    jwtSecret: process.env.JWT_SECRET!,  // Must be set
    stripeKey: process.env.STRIPE_SECRET_KEY!,
  },
};

// Validate required secrets on startup
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

## Observability & Monitoring

### 18. Structured Logging ✅

```typescript
import { logger } from '@shopping-app/common';

// Good logging practices
logger.info('Order created', {
  orderId: order.id,
  userId: user.id,
  total: order.total,
  itemCount: order.items.length,
  service: 'order-service',
  environment: process.env.NODE_ENV,
});

logger.error('Payment failed', {
  orderId: order.id,
  error: error.message,
  stack: error.stack,
  stripeErrorCode: error.code,
  service: 'payment-service',
});

// Correlation IDs for tracing requests across services
const correlationId = req.headers['x-correlation-id'] || generateId();
req.correlationId = correlationId;

logger.info('Processing request', {
  correlationId,
  method: req.method,
  path: req.path,
  userId: req.user?.id,
});
```

### 19. Health Checks ✅

```typescript
// services/order-service/src/routes/health.routes.ts
router.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    kafka: await checkKafka(),
    redis: await checkRedis(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };
  
  const isHealthy = checks.database && checks.kafka && checks.redis;
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'order-service',
    version: process.env.VERSION || '1.0.0',
    checks,
  });
});

async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function checkKafka(): Promise<boolean> {
  try {
    // Check if Kafka connection is active
    return eventBus.isConnected();
  } catch {
    return false;
  }
}
```

### 20. Metrics & Alerting

**Prometheus Metrics** (Future Implementation):

```typescript
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

// Counter: Number of orders created
const orderCreatedCounter = new Counter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['status'],
  registers: [register],
});

// Histogram: Order processing time
const orderProcessingTime = new Histogram({
  name: 'order_processing_duration_seconds',
  help: 'Order processing duration',
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Usage
async function createOrder(data: CreateOrderDTO) {
  const timer = orderProcessingTime.startTimer();
  
  try {
    const order = await orderService.create(data);
    orderCreatedCounter.inc({ status: 'success' });
    return order;
  } catch (error) {
    orderCreatedCounter.inc({ status: 'error' });
    throw error;
  } finally {
    timer();
  }
}

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## Testing Strategies

### 21. Testing Pyramid

```
    /\
   /E2E\      10% - End-to-end tests (full user flows)
  /------\
 /Integr.\   20% - Integration tests (service interactions)
/----------\
|   Unit   | 70% - Unit tests (functions, classes)
------------
```

**Unit Tests**:
```typescript
// services/order-service/src/__tests__/order.service.test.ts
describe('OrderService', () => {
  it('calculates order total correctly', () => {
    const items = [
      { price: 10.00, quantity: 2 },  // 20
      { price: 5.50, quantity: 3 },   // 16.50
    ];
    
    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(36.50);
  });
  
  it('throws error for invalid quantity', () => {
    expect(() => {
      validateQuantity(-1);
    }).toThrow('Quantity must be positive');
  });
});
```

**Integration Tests**:
```typescript
// services/order-service/src/__tests__/order.integration.test.ts
describe('Order API Integration', () => {
  let app: Express;
  let prisma: PrismaClient;
  
  beforeAll(async () => {
    // Setup test database
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL } },
    });
    await prisma.$connect();
    
    app = createApp();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  it('creates order and reserves inventory', async () => {
    // Create order
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${testToken}`)
      .send(mockOrderData);
    
    expect(response.status).toBe(201);
    
    // Wait for event processing
    await sleep(1000);
    
    // Verify inventory was reserved
    const inventory = await inventoryService.getStock(productId);
    expect(inventory.reserved).toBe(mockOrderData.items[0].quantity);
  });
});
```

**Contract Tests** (Pact):
```typescript
// Verify Order Service contract with Payment Service
describe('Order Service → Payment Service', () => {
  it('provides valid payment intent payload', async () => {
    await provider
      .given('order exists')
      .uponReceiving('a payment intent request')
      .withRequest({
        method: 'POST',
        path: '/api/payments/intent',
        body: {
          orderId: Matchers.uuid(),
          amount: Matchers.decimal(2),
        },
      })
      .willRespondWith({
        status: 200,
        body: {
          paymentIntentId: Matchers.string(),
          clientSecret: Matchers.string(),
        },
      });
    
    await provider.verify();
  });
});
```

---

## Deployment & DevOps

### 22. Docker Best Practices ✅

**Multi-stage builds**:
```dockerfile
# services/order-service/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Run as non-root user
USER node

EXPOSE 3003

CMD ["node", "dist/server.js"]
```

**Docker Compose for Development**:
```yaml
version: '3.8'

services:
  order-service:
    build: ./services/order-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@order-db:5432/order_db
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - order-db
      - kafka
    volumes:
      - ./services/order-service/src:/app/src
    command: npm run dev
```

### 23. CI/CD Pipeline

```yaml
# .github/workflows/order-service.yml
name: Order Service CI/CD

on:
  push:
    paths:
      - 'services/order-service/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd services/order-service
          npm ci
      
      - name: Run tests
        run: |
          cd services/order-service
          npm test
      
      - name: Build
        run: |
          cd services/order-service
          npm run build
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy logic here
```

---

## Performance Optimization

### 24. Database Query Optimization

**Use indexes**:
```prisma
model Order {
  id        String   @id @default(uuid())
  userId    String   @index  // Index for faster queries
  status    String   @index
  createdAt DateTime @default(now()) @index
  
  @@index([userId, status])  // Composite index
  @@index([createdAt])
}
```

**Avoid N+1 queries**:
```typescript
// ❌ BAD: N+1 queries
const orders = await prisma.order.findMany();
for (const order of orders) {
  order.items = await prisma.orderItem.findMany({
    where: { orderId: order.id },
  });
}

// ✅ GOOD: Single query with include
const orders = await prisma.order.findMany({
  include: {
    items: true,
  },
});
```

**Use select to limit fields**:
```typescript
// ❌ BAD: Fetch all fields
const users = await prisma.user.findMany();

// ✅ GOOD: Only fetch needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
  },
});
```

### 25. Connection Pooling

```typescript
// Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});

// Configure pool size
// DATABASE_URL=postgresql://user:pass@localhost:5432/db?connection_limit=10
```

---

## Summary Checklist

### Architecture ✅
- [x] Database per service pattern
- [x] API Gateway for routing
- [x] Event-driven communication (Kafka)
- [x] Saga pattern for distributed transactions
- [x] Service discovery (static config)

### Resilience ✅
- [ ] Circuit breaker pattern (TODO)
- [x] Retry with exponential backoff
- [x] Timeouts on external calls
- [x] Graceful degradation
- [x] Health checks

### Security ✅
- [x] Rate limiting
- [x] Input validation (Zod)
- [x] SQL injection protection (Prisma)
- [x] CORS configuration
- [x] Security headers (Helmet)
- [x] Secrets management

### Data Management ✅
- [x] Strong consistency (transactions)
- [x] Eventual consistency (events)
- [x] Caching (Redis)
- [x] Idempotency

### Observability ✅
- [x] Structured logging
- [x] Health checks
- [x] Correlation IDs
- [ ] Metrics (Prometheus) - TODO
- [ ] Distributed tracing (Jaeger) - TODO

### Testing ✅
- [x] Unit tests
- [ ] Integration tests - TODO
- [ ] Contract tests - TODO
- [ ] E2E tests - TODO

### DevOps ✅
- [x] Docker containers
- [x] Docker Compose
- [ ] CI/CD pipelines - TODO
- [x] Environment configuration

---

**Status:** Phase 2 microservices follow industry best practices with room for future improvements (circuit breakers, metrics, advanced testing).

**Next Steps:**
1. Add circuit breaker implementation
2. Implement Prometheus metrics
3. Add distributed tracing
4. Expand test coverage
5. Set up CI/CD pipelines
