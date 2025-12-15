# Observability & Monitoring

## Logging Strategy

### Log Levels

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Levels**:
- **ERROR**: Authentication failures, system errors, exceptions
- **WARN**: Rate limit hits, suspicious activity, deprecated usage
- **INFO**: Successful logins, registrations, token refreshes
- **DEBUG**: Detailed flow information (development only)

### Structured Logging

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "User login successful",
  "userId": "uuid-here",
  "email": "user@example.com",
  "role": "CUSTOMER",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "duration": "125ms",
  "traceId": "abc-def-ghi"
}
```

### What to Log

#### Authentication Events
```typescript
// Registration
logger.info('User registered', {
  userId: user.id,
  email: user.email,
  role: user.role,
  timestamp: new Date()
});

// Login success
logger.info('Login successful', {
  userId: user.id,
  email: user.email,
  ip: req.ip
});

// Login failure
logger.warn('Login failed', {
  email: attemptedEmail,
  reason: 'Invalid credentials',
  ip: req.ip,
  attempts: failedAttempts
});

// Token refresh
logger.info('Token refreshed', {
  userId: user.id,
  tokenAge: tokenCreatedAt
});

// Logout
logger.info('User logged out', {
  userId: user.id,
  sessionDuration: calculateDuration()
});
```

#### Security Events
```typescript
// Rate limit exceeded
logger.warn('Rate limit exceeded', {
  ip: req.ip,
  endpoint: req.path,
  attempts: attemptCount
});

// Invalid token
logger.warn('Invalid token attempt', {
  ip: req.ip,
  reason: error.message
});

// Unauthorized access
logger.warn('Unauthorized access attempt', {
  userId: req.user?.id,
  endpoint: req.path,
  requiredRole: requiredRole,
  userRole: req.user?.role
});
```

#### Performance Metrics
```typescript
// Database query time
logger.debug('Database query', {
  operation: 'findByEmail',
  duration: '15ms',
  table: 'users'
});

// API response time
logger.info('API request', {
  method: req.method,
  path: req.path,
  statusCode: res.statusCode,
  duration: '87ms'
});
```

## Metrics Collection

### Application Metrics

#### Request Metrics
- **request_total**: Total number of requests
- **request_duration_seconds**: Request latency histogram
- **request_errors_total**: Total number of errors
- **request_rate**: Requests per second

#### Authentication Metrics
- **auth_login_total**: Login attempts (with status label)
- **auth_login_success_rate**: Percentage of successful logins
- **auth_registration_total**: New user registrations
- **auth_token_refresh_total**: Token refresh count
- **auth_logout_total**: Logout count

#### Token Metrics
- **jwt_generation_duration**: Token generation time
- **jwt_validation_duration**: Token validation time
- **refresh_token_active_count**: Active refresh tokens

#### Database Metrics
- **db_connection_pool_size**: Current pool size
- **db_query_duration**: Query execution time
- **db_query_errors**: Failed queries

### Implementation with Prometheus

```typescript
import promClient from 'prom-client';

// Register
const register = new promClient.Register();

// Metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const loginAttempts = new promClient.Counter({
  name: 'auth_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status']
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration);
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Health Checks

### Health Endpoint

```typescript
app.get('/health', async (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: process.env.APP_VERSION || '1.0.0',
    checks: {
      database: await checkDatabase(),
      memory: checkMemory(),
      uptime: process.uptime()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(
    check => check.status === 'UP'
  );
  
  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'UP', responseTime: '5ms' };
  } catch (error) {
    return { status: 'DOWN', error: error.message };
  }
}

function checkMemory() {
  const usage = process.memoryUsage();
  const threshold = 0.9; // 90% threshold
  const percentage = usage.heapUsed / usage.heapTotal;
  
  return {
    status: percentage < threshold ? 'UP' : 'WARN',
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    percentage: `${Math.round(percentage * 100)}%`
  };
}
```

### Readiness vs Liveness

#### Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

#### Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

```typescript
app.get('/ready', async (req, res) => {
  try {
    // Check critical dependencies
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ status: 'READY' });
  } catch (error) {
    res.status(503).json({ status: 'NOT_READY', error: error.message });
  }
});
```

## Tracing

### Distributed Tracing with OpenTelemetry

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('auth-service');

export const authService = {
  async login(email: string, password: string) {
    const span = tracer.startSpan('auth.login');
    
    try {
      span.setAttribute('user.email', email);
      
      const user = await this.findUserByEmail(email);
      span.addEvent('user_found');
      
      const isValid = await this.verifyPassword(password, user.password);
      span.addEvent('password_verified', { valid: isValid });
      
      if (!isValid) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        throw new UnauthorizedError('Invalid credentials');
      }
      
      const tokens = await this.generateTokens(user);
      span.addEvent('tokens_generated');
      
      span.setStatus({ code: SpanStatusCode.OK });
      return tokens;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  }
};
```

### Trace Context Propagation

```typescript
import { propagation, context } from '@opentelemetry/api';

app.use((req, res, next) => {
  // Extract trace context from incoming request
  const ctx = propagation.extract(context.active(), req.headers);
  
  context.with(ctx, () => {
    req.traceId = trace.getSpan(context.active())?.spanContext().traceId;
    next();
  });
});
```

## Alerting Rules

### Critical Alerts (PagerDuty)

#### Service Down
```yaml
alert: AuthServiceDown
expr: up{job="auth-service"} == 0
for: 1m
severity: critical
description: Auth service is down
```

#### High Error Rate
```yaml
alert: AuthHighErrorRate
expr: rate(auth_errors_total[5m]) > 0.05
for: 5m
severity: critical
description: Error rate above 5%
```

#### Database Connection Failure
```yaml
alert: AuthDatabaseDown
expr: auth_db_connection_status == 0
for: 1m
severity: critical
description: Cannot connect to database
```

### Warning Alerts (Slack)

#### Elevated Login Failures
```yaml
alert: AuthHighLoginFailures
expr: rate(auth_login_attempts_total{status="failed"}[5m]) > 10
for: 10m
severity: warning
description: High rate of failed login attempts
```

#### High Response Time
```yaml
alert: AuthHighLatency
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
for: 10m
severity: warning
description: 95th percentile latency above 1s
```

#### Memory Usage High
```yaml
alert: AuthHighMemoryUsage
expr: process_resident_memory_bytes / process_virtual_memory_bytes > 0.9
for: 15m
severity: warning
description: Memory usage above 90%
```

## Dashboard Recommendations

### Grafana Dashboard Panels

#### Panel 1: Request Rate
```
Query: rate(http_requests_total[5m])
Visualization: Time series graph
Description: Requests per second over time
```

#### Panel 2: Error Rate
```
Query: rate(http_requests_total{status_code=~"5.."}[5m])
Visualization: Time series graph with threshold
Description: Server errors over time
```

#### Panel 3: Response Time Distribution
```
Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
Visualization: Heatmap
Description: P50, P90, P95, P99 latencies
```

#### Panel 4: Authentication Success Rate
```
Query: rate(auth_login_attempts_total{status="success"}[5m]) / 
       rate(auth_login_attempts_total[5m])
Visualization: Gauge
Description: Percentage of successful logins
```

#### Panel 5: Active Users
```
Query: count(refresh_token_active_count)
Visualization: Stat
Description: Currently authenticated users
```

#### Panel 6: Database Performance
```
Query: rate(db_query_duration_seconds_sum[5m]) / 
       rate(db_query_duration_seconds_count[5m])
Visualization: Time series
Description: Average database query time
```

## Log Aggregation

### ELK Stack Integration

```typescript
// Logstash format
const logstashFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.printf(info => {
    return JSON.stringify({
      '@timestamp': info.timestamp,
      '@version': '1',
      message: info.message,
      level: info.level,
      service: 'auth-service',
      environment: process.env.NODE_ENV,
      ...info
    });
  })
);
```

### Log Queries (Kibana)

#### Failed Logins by IP
```
service:auth-service AND level:warn AND message:"Login failed"
| stats count by ip
| sort -count
```

#### Average Response Time
```
service:auth-service AND duration:*
| stats avg(duration) by endpoint
```

#### Error Trends
```
service:auth-service AND level:error
| timechart count by error.type
```

## Performance Monitoring

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | 99.9% | Uptime monitoring |
| Response Time (P95) | <100ms | Request duration histogram |
| Error Rate | <0.1% | Error count / total requests |
| Token Generation Time | <50ms | JWT generation duration |
| Database Query Time | <20ms | Query duration histogram |
| Throughput | 500 req/s | Request rate counter |

### Synthetic Monitoring

```typescript
// Healthcheck script (runs every 60s)
async function syntheticCheck() {
  const start = Date.now();
  
  try {
    // Test registration
    const registerResponse = await fetch('https://api.example.com/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'Test123456',
        firstName: 'Test',
        lastName: 'User'
      })
    });
    
    // Test login
    const loginResponse = await fetch('https://api.example.com/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'monitor@example.com',
        password: 'MonitorPassword123'
      })
    });
    
    const duration = Date.now() - start;
    
    metrics.syntheticCheck.observe(duration);
    metrics.syntheticCheckSuccess.inc();
  } catch (error) {
    metrics.syntheticCheckFailure.inc();
    logger.error('Synthetic check failed', { error: error.message });
  }
}
```

## Observability Best Practices

1. **Structured Logging**: Always use JSON format for machine parsing
2. **Correlation IDs**: Include trace IDs in all logs
3. **Sensitive Data**: Never log passwords, tokens, or PII
4. **Log Levels**: Use appropriate levels for filtering
5. **Metrics Naming**: Follow Prometheus naming conventions
6. **Dashboard Organization**: Group related metrics
7. **Alert Thresholds**: Tune to reduce noise
8. **Regular Reviews**: Analyze logs and metrics weekly
9. **Retention Policies**: Keep logs for 30 days, metrics for 90 days
10. **Cost Monitoring**: Track observability costs vs value
