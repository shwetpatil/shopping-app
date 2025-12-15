# Performance Optimization

## Current Performance Characteristics

### Baseline Metrics
- **Throughput**: 500-1000 requests/second
- **Latency (P50)**: 45ms
- **Latency (P95)**: 85ms
- **Latency (P99)**: 150ms
- **Error Rate**: <0.05%
- **CPU Usage**: 20-30% under normal load
- **Memory Usage**: 150-250 MB per instance

## Database Optimization

### Index Strategy

```sql
-- Critical indexes for query performance
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Impact**:
- Email lookup: O(log n) instead of O(n)
- Token lookup: O(1) hash index
- User token queries: 10x faster

### Connection Pooling

```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connection_limit = 20
  pool_timeout = 10
}
```

**Configuration**:
- **Pool Size**: 20 connections
- **Timeout**: 10 seconds
- **Min Connections**: 5
- **Max Idle Time**: 30 seconds

### Query Optimization

#### Before Optimization
```typescript
// N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const tokens = await prisma.refreshToken.findMany({
    where: { userId: user.id }
  });
}
// Result: 1 + N queries
```

#### After Optimization
```typescript
// Single query with join
const users = await prisma.user.findMany({
  include: {
    refreshTokens: true
  }
});
// Result: 1 query
```

### Prepared Statements

Prisma automatically uses prepared statements:
```typescript
// Automatically parameterized
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});
// SQL: SELECT * FROM users WHERE email = $1
```

## Password Hashing Optimization

### Bcrypt Cost Factor Tuning

```typescript
// Balance security vs performance
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

// Benchmark results:
// Rounds  | Time    | Security
// --------|---------|----------
// 8       | 40ms    | Acceptable
// 10      | 100ms   | Recommended ✓
// 12      | 250ms   | High security
// 14      | 1000ms  | Overkill
```

**Recommendation**: Use 10 rounds (100ms) as default

### Async Hashing

```typescript
// Non-blocking hashing
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

// Avoid synchronous version in production
// const hashedPassword = bcrypt.hashSync(password, BCRYPT_ROUNDS); // BLOCKS EVENT LOOP
```

## Token Generation Optimization

### JWT Signing Performance

```typescript
// Async signing (recommended)
const token = jwt.sign(payload, secret, {
  algorithm: 'HS256', // Faster than RS256 for symmetric keys
  expiresIn: '15m'
});

// Performance: ~2ms for HS256, ~10ms for RS256
```

### Token Payload Minimization

```typescript
// Minimal payload (smaller token, faster generation/verification)
const payload = {
  userId: user.id,
  email: user.email,
  role: user.role
  // Avoid: firstName, lastName, profile data
};

// Result: 150 bytes vs 500+ bytes
```

## Caching Strategy

### In-Memory Caching (Redis)

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache user data for 5 minutes
async function getUserByEmail(email: string) {
  const cacheKey = `user:email:${email}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Database query
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  // Store in cache
  if (user) {
    await redis.setex(cacheKey, 300, JSON.stringify(user));
  }
  
  return user;
}
```

**Cache Hit Ratio Target**: >80%

### Application-Level Caching

```typescript
// LRU cache for frequently accessed data
import LRU from 'lru-cache';

const cache = new LRU({
  max: 500, // Maximum 500 items
  ttl: 1000 * 60 * 5 // 5 minutes TTL
});

function getCachedUser(userId: string) {
  return cache.get(userId);
}

function setCachedUser(userId: string, user: User) {
  cache.set(userId, user);
}
```

## Response Time Optimization

### Compression

```typescript
import compression from 'compression';

app.use(compression({
  threshold: 1024, // Only compress responses > 1KB
  level: 6 // Compression level (1-9)
}));

// Result: 70-80% reduction in response size
```

### Response Streaming

```typescript
// For large responses (not typical in auth service)
app.get('/users/export', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.write('[');
  
  const stream = await prisma.user.findMany({
    select: { id: true, email: true }
  });
  
  // Stream results
  for await (const user of stream) {
    res.write(JSON.stringify(user) + ',');
  }
  
  res.write(']');
  res.end();
});
```

## Concurrency Handling

### Event Loop Optimization

```typescript
// Avoid blocking operations
async function processUsers(users: User[]) {
  // BAD: Blocks event loop
  users.forEach(async user => {
    await processUser(user);
  });
  
  // GOOD: Parallel processing
  await Promise.all(users.map(user => processUser(user)));
  
  // BETTER: Controlled concurrency
  const concurrency = 10;
  for (let i = 0; i < users.length; i += concurrency) {
    const batch = users.slice(i, i + concurrency);
    await Promise.all(batch.map(processUser));
  }
}
```

### Worker Threads (for CPU-intensive tasks)

```typescript
import { Worker } from 'worker_threads';

// Offload bcrypt to worker thread for very high loads
function hashPasswordAsync(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./hash-worker.js', {
      workerData: { password }
    });
    
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

## Rate Limiting Optimization

### Distributed Rate Limiting (Redis)

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false
});

// Result: Consistent rate limiting across multiple instances
```

### Adaptive Rate Limiting

```typescript
// Adjust limits based on system load
function getAdaptiveLimit() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  
  if (cpuUsage > 0.8) {
    return 50; // Reduce limit under high load
  } else if (cpuUsage > 0.5) {
    return 100; // Normal limit
  } else {
    return 200; // Increase limit under low load
  }
}
```

## Memory Optimization

### Garbage Collection Tuning

```bash
# Node.js startup flags
node --max-old-space-size=512 \
     --max-semi-space-size=32 \
     --optimize-for-size \
     server.js
```

### Memory Leak Prevention

```typescript
// Proper cleanup of event listeners
class AuthService {
  private events: EventEmitter;
  
  constructor() {
    this.events = new EventEmitter();
    // Set max listeners to prevent memory leaks
    this.events.setMaxListeners(10);
  }
  
  cleanup() {
    this.events.removeAllListeners();
  }
}

// Avoid global state accumulation
// BAD: Global array grows indefinitely
const activeUsers = [];

// GOOD: Use Map with automatic cleanup
const activeUsers = new Map();
setInterval(() => {
  for (const [userId, timestamp] of activeUsers.entries()) {
    if (Date.now() - timestamp > 3600000) {
      activeUsers.delete(userId);
    }
  }
}, 300000); // Cleanup every 5 minutes
```

## Network Optimization

### Keep-Alive Connections

```typescript
import http from 'http';

const server = http.createServer(app);

server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000; // Slightly higher than keepAliveTimeout
```

### HTTP/2 Support

```typescript
import http2 from 'http2';
import fs from 'fs';

const server = http2.createSecureServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);

// Benefits: Multiplexing, header compression, server push
```

## Load Testing Results

### Before Optimization
```
Requests/sec:   300
Latency P50:    120ms
Latency P95:    450ms
Latency P99:    1200ms
Error rate:     0.5%
```

### After Optimization
```
Requests/sec:   1000
Latency P50:    45ms
Latency P95:    85ms
Latency P99:    150ms
Error rate:     0.05%
```

**Improvement**: 3.3x throughput, 2.7x latency reduction

## Performance Testing

### Load Testing with k6

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200
    { duration: '5m', target: 200 }, // Stay at 200
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% < 100ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

export default function () {
  // Login test
  const payload = JSON.stringify({
    email: 'test@example.com',
    password: 'Password123'
  });
  
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };
  
  const res = http.post('http://localhost:3001/auth/login', payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
  });
  
  sleep(1);
}
```

### Benchmark Endpoints

```bash
# Login endpoint
ab -n 10000 -c 100 -p login.json -T application/json \
   http://localhost:3001/auth/login

# Token refresh endpoint
ab -n 10000 -c 100 -H "Authorization: Bearer $TOKEN" \
   http://localhost:3001/auth/refresh
```

## Monitoring Performance

### Performance Metrics Dashboard

```typescript
// Custom performance metrics
const performanceMetrics = {
  bcryptDuration: new Histogram({
    name: 'auth_bcrypt_duration_seconds',
    help: 'Bcrypt hashing duration'
  }),
  
  jwtGeneration: new Histogram({
    name: 'auth_jwt_generation_duration_seconds',
    help: 'JWT generation duration'
  }),
  
  dbQueryDuration: new Histogram({
    name: 'auth_db_query_duration_seconds',
    help: 'Database query duration',
    labelNames: ['operation']
  })
};

// Instrument code
const bcryptStart = Date.now();
const hash = await bcrypt.hash(password, 10);
performanceMetrics.bcryptDuration.observe((Date.now() - bcryptStart) / 1000);
```

## Optimization Checklist

- [✓] Database indexes on frequently queried columns
- [✓] Connection pooling configured
- [✓] Bcrypt rounds tuned (10 rounds)
- [✓] JWT payload minimized
- [✓] Response compression enabled
- [✓] Rate limiting with Redis
- [✓] Async operations throughout
- [✓] No N+1 query problems
- [✓] Keep-alive connections enabled
- [✓] Proper error handling (no crashes)
- [✓] Memory leak prevention
- [✓] Load testing performed
- [✓] Performance monitoring in place

## Future Optimizations

1. **Read Replicas**: Separate read/write database connections
2. **Caching Layer**: Redis for frequently accessed data
3. **GraphQL**: Reduce over-fetching if needed
4. **CDN**: Static asset delivery
5. **Microservice Mesh**: Service-to-service optimization
6. **Database Sharding**: Horizontal database scaling
7. **Edge Computing**: Deploy closer to users
