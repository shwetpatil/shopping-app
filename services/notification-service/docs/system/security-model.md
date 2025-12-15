# Security Model

## Overview

This document describes the comprehensive security architecture implemented in the Shopping App microservices. Our security approach follows defense-in-depth principles with multiple layers of protection.

## Security Layers

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Network Security (TLS/HTTPS)         │
├─────────────────────────────────────────────────┤
│  Layer 2: API Gateway (Rate Limiting, CORS)    │
├─────────────────────────────────────────────────┤
│  Layer 3: Authentication (JWT + Token Mgmt)    │
├─────────────────────────────────────────────────┤
│  Layer 4: Authorization (RBAC)                 │
├─────────────────────────────────────────────────┤
│  Layer 5: Input Validation & Sanitization      │
├─────────────────────────────────────────────────┤
│  Layer 6: Data Encryption (Transit & Rest)     │
├─────────────────────────────────────────────────┤
│  Layer 7: Audit Logging & Monitoring           │
└─────────────────────────────────────────────────┘
```

## 1. Authentication Mechanisms

### 1.1 Password-Based Authentication

#### Password Storage
- **Algorithm**: bcrypt with adaptive hashing
- **Salt Rounds**: 10 (configurable via `BCRYPT_ROUNDS`)
- **Hash Example**: `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- **Security Features**:
  - Prevents rainbow table attacks
  - Constant-time comparison prevents timing attacks
  - Adaptive cost factor (can be increased as hardware improves)

```typescript
// Password hashing
const hashedPassword = await bcrypt.hash(password, 10);

// Password verification (constant-time comparison built-in)
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

#### Password Requirements
- **Minimum Length**: 8 characters (configurable)
- **Validation**: Zod schema enforcement at API layer
- **Complexity**: Configurable requirements (uppercase, numbers, special chars)
- **Storage**: Never stored in plain text
- **Transmission**: Only over HTTPS with TLS 1.3
- **History**: Previous passwords tracked to prevent reuse

### 1.2 JWT Token Authentication

#### Access Token
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "CUSTOMER|ADMIN|VENDOR",
    "iat": 1704067200,
    "exp": 1704068100
  }
}
```

**Properties**:
- **Lifetime**: 15 minutes (configurable)
- **Algorithm**: HS256 (HMAC SHA-256)
- **Secret**: `JWT_SECRET` environment variable (minimum 32 characters)
- **Signature**: HMAC prevents tampering and verifies authenticity
- **Stateless**: No database lookup required for validation
- **Claims**: Standard (iat, exp) + custom (userId, email, role)

**Token Blacklisting** (Logout Protection):
```typescript
// When user logs out, token is blacklisted
await blacklistToken(token, expiresIn);

// Middleware checks blacklist before accepting token
const blacklisted = await isTokenBlacklisted(token);
if (blacklisted) {
  throw new UnauthorizedError('Token has been revoked');
}
```

**Implementation**: Redis-based blacklist with automatic expiration
- **Key Format**: `blacklist:${token}`
- **TTL**: Remaining token lifetime
- **Cleanup**: Automatic via Redis expiration

#### Refresh Token
```json
{
  "id": "uuid",
  "userId": "uuid",
  "token": "random-uuid-v4",
  "expiresAt": "2024-01-08T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Properties**:
- **Lifetime**: 7 days (configurable)
- **Format**: Cryptographically secure UUID v4
- **Storage**: Database with encryption at rest
- **Usage**: One-time use for access token renewal
- **Rotation**: New refresh token issued on each use
- **Family Tracking**: Detects token theft via reuse detection

### 1.3 API Key Authentication (Service-to-Service)

For microservice communication, API keys provide authentication:

```typescript
// Generate secure API key
const apiKey = generateApiKey(); // 64-character hex string

// Hash for storage
const hashedKey = hashApiKey(apiKey);

// Verify in middleware
const isValid = verifyApiKey(providedKey, storedHash);
```

**Implementation**:
```typescript
// Add to request headers
headers: {
  'X-API-Key': 'your-api-key',
  'X-Service-Name': 'inventory-service'
}

// Middleware validation
app.use(requireApiKey());
app.use(requireServiceAuth({
  serviceName: 'product-service',
  allowedServices: ['inventory-service', 'order-service']
}));
```

**Features**:
- **Generation**: Cryptographically secure random bytes
- **Storage**: SHA-256 hashed in database
- **Rotation**: Scheduled rotation policy
- **Scoping**: Service-specific keys with limited permissions
- **Rate Limiting**: Stricter limits than user tokens (1000 req/min)

## 2. Authorization Model

### 2.1 Role-Based Access Control (RBAC)

#### Roles
```typescript
enum UserRole {
  CUSTOMER = 'CUSTOMER',  // Regular shopping users
  ADMIN = 'ADMIN',        // System administrators
  VENDOR = 'VENDOR'       // Product sellers
}
```

#### Permission Matrix

| Endpoint | CUSTOMER | ADMIN | VENDOR |
|----------|----------|-------|--------|
| POST /auth/register | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ |
| POST /auth/refresh | ✅ | ✅ | ✅ |
| POST /auth/logout | ✅ | ✅ | ✅ |
| GET /products | ✅ | ✅ | ✅ |
| POST /products | ❌ | ✅ | ✅ |
| PUT /products/:id | ❌ | ✅ | ✅ (own) |
| DELETE /products/:id | ❌ | ✅ | ❌ |
| POST /orders | ✅ | ✅ | ✅ |
| GET /orders/:id | ✅ (own) | ✅ (all) | ✅ (related) |
| POST /cart/items | ✅ | ✅ | ❌ |
| GET /inventory/:id | ✅ | ✅ | ✅ |
| PUT /inventory/:id | ❌ | ✅ | ✅ |

#### Middleware Implementation

```typescript
// Authentication middleware
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
};

// Authorization middleware
export const authorize = (...roles: UserRole[]) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
};
```

## 3. Rate Limiting & DDoS Protection

### 3.1 Redis-Based Rate Limiting

**Implementation**: Distributed rate limiting using Redis for consistency across service instances.

```typescript
// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 5              // 5 login attempts
  },
  api: {
    windowMs: 60 * 1000,        // 1 minute
    maxRequests: 100            // 100 requests per minute
  },
  write: {
    windowMs: 60 * 1000,
    maxRequests: 30             // 30 write operations per minute
  }
};

// Apply to routes
router.post('/login', authRateLimit(), authController.login);
router.get('/products', readRateLimit(), productController.list);
router.post('/orders', writeRateLimit(), orderController.create);
```

**Features**:
- **Per-User/IP Tracking**: Identifies users by ID (authenticated) or IP address
- **Automatic Expiration**: Redis TTL cleans up old counters
- **Response Headers**: Informs clients of limits
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in window
  - `X-RateLimit-Reset`: When the limit resets
  - `Retry-After`: Seconds to wait before retry
- **Graceful Degradation**: If Redis fails, requests are allowed (fail-open)

### 3.2 Rate Limit Tiers

| Tier | Window | Max Requests | Use Case |
|------|--------|--------------|----------|
| Auth | 15 min | 5 | Login, register, password reset |
| Read | 1 min | 200 | GET requests, product browsing |
| Write | 1 min | 30 | POST/PUT/DELETE operations |
| API | 1 min | 100 | General API calls |
| API Key | 1 min | 1000 | Service-to-service calls |

## 4. Input Sanitization & XSS Prevention

### 4.1 Request Sanitization

**Multi-Layer Protection**:

```typescript
// 1. NoSQL Injection Prevention
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    logger.warn(`Sanitized field ${key} from ${req.ip}`);
  }
}));

// 2. XSS Prevention
app.use(sanitizeInput); // Recursively sanitizes body, query, params

// 3. Parameter Pollution Prevention
app.use(preventParameterPollution);
```

**XSS Filter**: Uses `xss` library to strip malicious HTML/JavaScript:

```typescript
// Before: <script>alert('xss')</script>
// After:  &lt;script&gt;alert('xss')&lt;/script&gt;

// Protects against:
- Script injection: <script>...</script>
- Event handlers: <img onerror="...">
- Data URIs: <img src="data:text/html,<script>...">
- Style-based attacks: <style>@import url(...)</style>
```

### 4.2 File Upload Sanitization

```typescript
app.use(sanitizeFileUpload);

// Features:
- Filename sanitization (removes special characters)
- Extension validation (whitelist-based)
- MIME type verification
- File size limits
- Virus scanning (optional, via external service)
```

**Allowed Extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.pdf`, `.doc`, `.docx`

## 5. Security Headers

### 5.1 Helmet.js Integration

**Comprehensive header protection**:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,      // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true
}));
```

### 5.2 Security Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Enables browser XSS filter |
| `Content-Security-Policy` | (see above) | Restricts resource loading |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info |
| `X-DNS-Prefetch-Control` | `off` | Disables DNS prefetching |

## 6. CORS Configuration

### 6.1 Whitelist-Based CORS

**Production Configuration**:

```typescript
const corsMiddleware = cors({
  origin: (origin, callback) => {
    const whitelist = process.env.CORS_WHITELIST?.split(',') || [
      'https://yourdomain.com',
      'https://www.yourdomain.com',
      'https://admin.yourdomain.com'
    ];
    
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID'
  ],
  maxAge: 86400  // 24 hours
});
```

**Development vs Production**:
- **Development**: `allowAllOrigins: true` for easy testing
- **Production**: Strict whitelist enforcement
- **Credentials**: Always `true` to support cookies/auth headers

## 7. Data Encryption

### 7.1 Encryption at Rest

**AES-256-GCM Encryption** for sensitive data:

```typescript
import { encrypt, decrypt, encryptObject, decryptObject } from '@shopping-app/common';

// Encrypt sensitive strings
const encryptedCard = encrypt(cardNumber);
const encryptedSSN = encrypt(socialSecurityNumber);

// Decrypt when needed
const originalCard = decrypt(encryptedCard);

// Encrypt entire objects
const encryptedUser = encryptObject({ email, phone, address });
const originalUser = decryptObject<User>(encryptedUser);
```

**Encryption Features**:
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: 64 random bytes per encryption
- **IV**: 16 random bytes per encryption
- **Auth Tag**: 16-byte authentication tag prevents tampering
- **Key Storage**: `ENCRYPTION_KEY` environment variable (min 32 chars)

**Use Cases**:
- Credit card numbers (tokenized)
- Personal identification numbers
- Sensitive addresses
- Phone numbers
- Email addresses (when required)
- Backup/recovery codes

### 7.2 Encryption in Transit

**TLS 1.3 Configuration**:
- **Protocol**: TLS 1.3 (minimum TLS 1.2)
- **Cipher Suites**: Modern, secure ciphers only
- **Certificate**: Valid SSL/TLS from trusted CA
- **HSTS**: Enforced via `Strict-Transport-Security` header
- **Certificate Pinning**: Optional for mobile apps

### 7.3 Field-Level Encryption

**Selective encryption** for database fields:

```typescript
// Encrypt specific fields before saving
const user = encryptFields(userData, ['ssn', 'creditCard', 'taxId']);
await prisma.user.create({ data: user });

// Decrypt fields after retrieval
const dbUser = await prisma.user.findUnique({ where: { id } });
const decryptedUser = decryptFields(dbUser, ['ssn', 'creditCard', 'taxId']);
```

## 8. Security Threats & Mitigations

### 8.1 Brute Force Attacks

**Threat**: Automated password guessing

**Mitigation**:
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ Account lockout after failed attempts
- ✅ CAPTCHA after 3 failed attempts (optional)
- ✅ Login attempt logging with IP tracking
- ✅ Notification emails on suspicious activity

### 8.2 Token Theft & Replay

**Threat**: Stolen JWT tokens used for unauthorized access

**Mitigation**:
- ✅ Short-lived access tokens (15 minutes)
- ✅ Redis-based token blacklisting on logout
- ✅ Refresh token rotation on each use
- ✅ Token reuse detection (family tracking)
- ✅ Secure token storage recommendations
- ✅ Device/IP binding (optional)

### 8.3 SQL/NoSQL Injection

**Threat**: Malicious database queries via user input

**Mitigation**:
- ✅ Prisma ORM with parameterized queries (SQL)
- ✅ MongoDB sanitization middleware (NoSQL)
- ✅ Input validation with Zod schemas
- ✅ No raw queries without sanitization
- ✅ Type safety with TypeScript

```typescript
// Safe - Prisma parameterizes automatically
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// NoSQL injection prevention
app.use(mongoSanitize({ replaceWith: '_' }));
```

### 8.4 Cross-Site Scripting (XSS)

**Threat**: Injection of malicious JavaScript

**Mitigation**:
- ✅ Input sanitization on all user inputs
- ✅ Output encoding
- ✅ Content Security Policy (CSP) headers
- ✅ XSS filter middleware
- ✅ No innerHTML or eval usage
- ✅ Sanitized file uploads

### 8.5 Cross-Site Request Forgery (CSRF)

**Threat**: Unauthorized actions on behalf of authenticated users

**Mitigation**:
- ✅ SameSite cookie attribute (`strict` or `lax`)
- ✅ CSRF tokens for state-changing operations
- ✅ Origin header validation
- ✅ Double-submit cookie pattern
- ✅ Custom request headers (X-Requested-With)

```typescript
// CORS with credentials requires specific origin
app.use(cors({
  origin: whitelist,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
```

### 8.6 Timing Attacks

**Threat**: Using response timing to gain information

**Mitigation**:
- ✅ Constant-time comparison for sensitive data
- ✅ bcrypt's constant-time password verification
- ✅ Rate limiting masks timing differences
- ✅ Consistent error messages

```typescript
import { secureCompare } from '@shopping-app/common';

// Constant-time string comparison
const isValid = secureCompare(providedToken, storedToken);
```

### 8.7 DDoS Attacks

**Threat**: Service unavailability via request flooding

**Mitigation**:
- ✅ Multi-tier rate limiting (per-IP, per-user, per-route)
- ✅ Request timeout configuration
- ✅ Connection limits
- ✅ Reverse proxy (Nginx/CloudFlare)
- ✅ Auto-scaling infrastructure
- ✅ Health checks and circuit breakers

### 8.8 Session Hijacking

**Threat**: Stealing user sessions to impersonate them

**Mitigation**:
- ✅ Secure cookie flags (httpOnly, secure, sameSite)
- ✅ Short session lifetimes
- ✅ Session regeneration on privilege escalation
- ✅ Token binding to IP/User-Agent (optional)
- ✅ Logout invalidates tokens (blacklist)

### 8.9 Man-in-the-Middle (MITM)

**Threat**: Intercepting communication between client and server

**Mitigation**:
- ✅ HTTPS everywhere (TLS 1.3)
- ✅ HSTS header with preload
- ✅ Certificate pinning (mobile apps)
- ✅ No mixed content
- ✅ Secure WebSocket (wss://)

### 8.10 Information Disclosure

**Threat**: Leaking sensitive information in errors/responses

**Mitigation**:
- ✅ Generic error messages to clients
- ✅ Detailed errors only in logs
- ✅ No stack traces in production
- ✅ Sensitive data masked in logs
- ✅ Remove debug endpoints in production
- ✅ Hide X-Powered-By header

## 9. Data Protection & Privacy

### 9.1 Sensitive Data Handling

| Data Type | In Transit | At Rest | In Logs | In Responses |
|-----------|-----------|---------|---------|--------------|
| **Passwords** | HTTPS only | bcrypt hashed | ❌ Never | ❌ Never |
| **JWT Secrets** | N/A | Env variable | ❌ Never | ❌ Never |
| **Refresh Tokens** | HTTPS only | Encrypted | Token ID only | ✅ On creation |
| **Credit Cards** | HTTPS only | Encrypted/Tokenized | Masked | Masked (last 4) |
| **Email Addresses** | HTTPS only | Plain/Encrypted | ✅ Yes | ✅ To owner only |
| **Phone Numbers** | HTTPS only | Encrypted | Masked | ✅ To owner only |
| **API Keys** | HTTPS only | SHA-256 hashed | ❌ Never | ❌ Never |
| **Personal IDs** | HTTPS only | Encrypted | ❌ Never | ❌ Never |

### 9.2 Data Masking

**Automatic masking** for sensitive data in logs and responses:

```typescript
import { maskString } from '@shopping-app/common';

// Credit card: 4532-****-****-3456
const masked = maskString(cardNumber, 4, '*');

// Phone: ******-5678
const maskedPhone = maskString(phone, 4, '*');

// Email: jo**@example.com
const maskedEmail = email.replace(/(.{2}).*@/, '$1**@');
```

### 9.3 Data Retention

**Automated cleanup** policies:

| Data Type | Retention Period | Cleanup Method |
|-----------|-----------------|----------------|
| Refresh Tokens | 7 days | Auto-expire + cron job |
| Blacklisted Tokens | Until JWT expiry | Redis TTL |
| Audit Logs | 90 days | Archival + deletion |
| Failed Login Attempts | 24 hours | Rolling window |
| Rate Limit Counters | Window duration | Redis TTL |
| Deleted User Data | 30 days (soft delete) | Hard delete job |

### 9.4 GDPR Compliance

**User rights** implementation:

```typescript
// Right to Access
GET /users/me/data-export
// Returns all user data in portable format

// Right to Deletion
DELETE /users/me
// Soft deletes user, schedules hard deletion in 30 days

// Right to Rectification
PATCH /users/me
// Allows users to update their data

// Right to Data Portability
GET /users/me/data-export?format=json
// Exports data in machine-readable format
```

**Consent Management**:
- Explicit opt-in for marketing emails
- Granular consent options
- Audit trail of consent changes
- Easy withdrawal mechanism

## 10. Audit & Monitoring

### 10.1 Security Event Logging

**Comprehensive audit trail**:

```typescript
// Authentication Events
logger.info('auth.login.attempt', {
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString()
});

logger.info('auth.login.success', {
  userId: user.id,
  role: user.role,
  sessionId: generateUUID()
});

logger.warn('auth.login.failed', {
  email: attemptedEmail,
  reason: 'invalid_password',
  ip: req.ip,
  attemptCount: 3
});

// Authorization Events
logger.warn('auth.unauthorized', {
  userId: req.user?.id,
  resource: req.path,
  action: req.method,
  reason: 'insufficient_permissions'
});

// Security Events
logger.error('security.token.blacklisted', {
  tokenId: tokenHash.substring(0, 8),
  userId: payload.userId,
  reason: 'user_logout'
});

logger.error('security.rate_limit.exceeded', {
  identifier: req.user?.id || req.ip,
  endpoint: req.path,
  limit: 100,
  window: '1m'
});

logger.error('security.xss.detected', {
  field: 'description',
  ip: req.ip,
  sanitized: true
});
```

### 10.2 What We Log

✅ **Security Events**:
- Authentication attempts (success/failure/lockout)
- Token generation, refresh, and revocation
- Authorization failures
- Rate limit violations
- Input sanitization triggers
- CORS violations
- Suspicious activity patterns

✅ **Audit Events**:
- User account changes (role, permissions)
- Password changes
- Email/phone updates
- Account deletion requests
- Data export requests (GDPR)

❌ **What We DON'T Log**:
- Passwords (plain or hashed)
- Full JWT tokens (only token IDs)
- Full refresh tokens
- Credit card numbers
- Social security numbers
- Encryption keys
- API keys (only hashes)

### 10.3 Monitoring & Alerts

**Real-time security monitoring**:

| Event | Threshold | Alert Level | Action |
|-------|-----------|-------------|--------|
| Failed Login | 5 per 15 min | ⚠️ Warning | Account lockout |
| Failed Login | 10 per hour | 🚨 Critical | IP ban + notify |
| Token Reuse | 1 occurrence | 🚨 Critical | Blacklist family |
| Rate Limit Hit | 3 per hour | ⚠️ Warning | Temp ban |
| XSS Detected | Any | 🚨 Critical | Block + log |
| CORS Violation | 10 per hour | ⚠️ Warning | Review origin |
| Auth Failure | 100 per min | 🚨 Critical | DDoS response |

### 10.4 Compliance & Reporting

#### Audit Reports
- Daily security incident summary
- Weekly access control review
- Monthly compliance report
- Quarterly security audit

#### GDPR Compliance
- ✅ Right to access (data export)
- ✅ Right to deletion (soft delete + scheduled purge)
- ✅ Right to rectification (user profile updates)
- ✅ Right to data portability (JSON/CSV export)
- ✅ Breach notification (within 72 hours)
- ✅ Consent management (opt-in/opt-out tracking)

#### PCI DSS Compliance (Payment Service)
- ✅ Encrypted transmission (TLS 1.3)
- ✅ Secure authentication (MFA support)
- ✅ Access control (RBAC)
- ✅ Network segmentation (microservices)
- ✅ Regular security testing
- ✅ No storage of full card numbers (tokenization)

## 11. Security Testing

### 11.1 Automated Testing

**Continuous security validation**:

```typescript
// Unit Tests
describe('Authentication Security', () => {
  it('should reject weak passwords', async () => {
    await expect(register({ password: '123' }))
      .rejects.toThrow('Password too weak');
  });

  it('should hash passwords with bcrypt', async () => {
    const user = await createUser({ password: 'SecurePass123!' });
    expect(user.password).toMatch(/^\$2[aby]\$10\$/);
  });

  it('should blacklist tokens on logout', async () => {
    await logout(token);
    await expect(useToken(token))
      .rejects.toThrow('Token has been revoked');
  });
});

// Rate Limiting Tests
describe('Rate Limiting', () => {
  it('should block after max attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request.post('/login').send(invalidCreds);
    }
    const response = await request.post('/login').send(invalidCreds);
    expect(response.status).toBe(429);
  });
});

// XSS Prevention Tests
describe('Input Sanitization', () => {
  it('should sanitize XSS in inputs', async () => {
    const response = await request.post('/products').send({
      name: '<script>alert("xss")</script>'
    });
    const product = response.body;
    expect(product.name).not.toContain('<script>');
  });
});
```

**Security Scanning**:
```bash
# Dependency vulnerability scanning
npm audit
npm audit fix

# Static code analysis
npm run lint:security

# Container scanning
docker scan shopping-app:latest

# OWASP dependency check
dependency-check --scan ./
```

### 11.2 Manual Testing

**Quarterly security audits**:
- 🔍 Penetration testing (external firm)
- 🔍 Code security review
- 🔍 Infrastructure review
- 🔍 Social engineering testing
- 🔍 Physical security audit

**Security Checklist**:
- [ ] All endpoints require authentication
- [ ] Authorization checks on all sensitive operations
- [ ] Rate limiting on all routes
- [ ] Input validation on all inputs
- [ ] No secrets in code or logs
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Database encrypted at rest
- [ ] Regular backups tested
- [ ] Incident response plan documented

## 12. Incident Response

### 12.1 Detection

**Automated anomaly detection**:
- Failed login spikes (>10/min from single IP)
- Unusual token refresh patterns (>5/min)
- Multiple 401/403 errors (>20/min)
- Geographic anomalies (login from new country)
- Velocity checks (impossible travel time)
- Known attack patterns (SQL injection attempts)

### 12.2 Response Procedure

**Incident Severity Levels**:

| Level | Definition | Response Time | Team |
|-------|------------|---------------|------|
| P0 - Critical | Active breach, data leak | < 15 min | All hands |
| P1 - High | Vulnerability exploited | < 1 hour | Security team |
| P2 - Medium | Suspicious activity | < 4 hours | On-call |
| P3 - Low | Policy violation | < 24 hours | Team lead |

**Response Steps**:
1. **Identify** - Confirm the incident and scope
2. **Contain** - Isolate affected systems, blacklist tokens
3. **Eradicate** - Remove threat, patch vulnerability
4. **Recover** - Restore normal operations, verify security
5. **Document** - Post-mortem, lessons learned
6. **Communicate** - Notify affected users (GDPR 72h requirement)

### 12.3 Recovery Actions

**Security breach response**:
```bash
# 1. Rotate all secrets
./scripts/rotate-secrets.sh

# 2. Invalidate all tokens
redis-cli FLUSHDB

# 3. Force password resets
npm run force-password-reset --all

# 4. Review audit logs
npm run analyze-security-logs --from "2 hours ago"

# 5. Deploy fixes
npm run deploy --emergency

# 6. Monitor closely
npm run monitor --security-mode
```

## 13. Security Best Practices

### 13.1 Development Guidelines

✅ **DO**:
- Use environment variables for secrets
- Validate all inputs with Zod schemas
- Sanitize user-generated content
- Use parameterized queries (Prisma)
- Implement proper error handling
- Write security unit tests
- Keep dependencies updated
- Use TypeScript for type safety
- Enable strict mode
- Follow principle of least privilege

❌ **DON'T**:
- Commit secrets to version control
- Trust user input
- Use `eval()` or `innerHTML`
- Store passwords in plain text
- Return detailed errors to clients
- Disable security features
- Use deprecated libraries
- Bypass authentication/authorization
- Log sensitive data
- Use weak encryption

### 13.2 Deployment Checklist

**Before production deployment**:
- [ ] All environment variables set
- [ ] Secrets rotated and secured
- [ ] Rate limiting configured
- [ ] CORS whitelist updated
- [ ] Security headers enabled
- [ ] HTTPS/TLS configured
- [ ] Database backups scheduled
- [ ] Monitoring alerts set up
- [ ] Incident response plan ready
- [ ] Security audit completed
- [ ] Penetration test passed
- [ ] Compliance requirements met

### 13.3 Ongoing Security

**Regular maintenance**:
- 📅 **Weekly**: Dependency updates and npm audit
- 📅 **Monthly**: Security log review and access audit
- 📅 **Quarterly**: Penetration testing and code review
- 📅 **Annually**: Comprehensive security audit and policy review

**Key Performance Indicators**:
- Mean time to detect (MTTD): < 5 minutes
- Mean time to respond (MTTR): < 30 minutes
- False positive rate: < 5%
- Failed login rate: < 1%
- Security test coverage: > 80%

## 14. Security Contacts

**Security Team**:
- Security Officer: security@yourdomain.com
- On-Call: +1-555-SECURITY
- Bug Bounty: bugbounty@yourdomain.com

**Responsible Disclosure**:
Please report security vulnerabilities to security@yourdomain.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

We commit to:
- Acknowledge within 24 hours
- Provide updates every 48 hours
- Fix critical issues within 7 days
- Credit researchers (with permission)
