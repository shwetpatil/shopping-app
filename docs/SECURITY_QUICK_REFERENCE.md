# Security Quick Reference

## 🔒 Security Features Overview

### Authentication & Authorization
- ✅ JWT-based authentication with refresh tokens
- ✅ Token blacklisting (logout support)
- ✅ Role-based access control (RBAC)
- ✅ API key authentication for services

### Protection Layers
- ✅ Rate limiting (Redis-based, distributed)
- ✅ Input sanitization (XSS, NoSQL injection)
- ✅ CORS with whitelist
- ✅ Security headers (Helmet.js)
- ✅ Data encryption (AES-256-GCM)

---

## 📦 Quick Setup

### 1. Install Dependencies
```bash
cd packages/common
npm install
```

### 2. Environment Variables
```bash
# .env
JWT_SECRET=<64-char-hex>
ENCRYPTION_KEY=<64-char-hex>
REDIS_URL=redis://localhost:6379
CORS_WHITELIST=https://yourdomain.com
API_KEYS=<api-key-1>,<api-key-2>
```

### 3. Apply Security Middleware
```typescript
import {
  securityHeaders,
  corsMiddleware,
  sanitize,
  apiRateLimit,
  requireAuth,
} from '@shopping-app/common';

app.use(securityHeaders);
app.use(corsMiddleware);
app.use(sanitize);
app.use(apiRateLimit());
```

---

## 🛡️ Common Use Cases

### Protect a Route
```typescript
import { requireAuth, requireRole } from '@shopping-app/common';

// Authentication only
app.get('/api/profile', requireAuth, handler);

// Authentication + authorization
app.post('/api/admin/users', requireAuth, requireRole('ADMIN'), handler);
```

### Rate Limit an Endpoint
```typescript
import { authRateLimit, writeRateLimit } from '@shopping-app/common';

// Strict rate limit for auth
app.post('/auth/login', authRateLimit(), handler);

// Moderate rate limit for writes
app.post('/api/orders', writeRateLimit(), requireAuth, handler);
```

### Encrypt Sensitive Data
```typescript
import { encrypt, decrypt, maskString } from '@shopping-app/common';

// Encrypt before saving
const encryptedSSN = encrypt(user.ssn);
await db.users.update({ id, ssn: encryptedSSN });

// Decrypt when needed
const user = await db.users.findOne({ id });
const ssn = decrypt(user.ssn);

// Mask for display/logs
const masked = maskString(user.creditCard, 4); // ************1234
```

### Service-to-Service Auth
```typescript
import { requireApiKey, addServiceAuthHeaders } from '@shopping-app/common';

// Server: Protect internal endpoint
app.post('/internal/reserve', requireApiKey(), handler);

// Client: Add auth headers
const client = axios.create({ baseURL: 'http://inventory:3000' });
client.interceptors.request.use(
  addServiceAuthHeaders('order-service', process.env.API_KEY!)
);
```

### Logout (Token Blacklist)
```typescript
import { blacklistToken } from '@shopping-app/common';

export const logout = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  const payload = jwt.decode(token) as any;
  const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
  
  await blacklistToken(token, expiresIn);
  res.json({ message: 'Logged out' });
};
```

---

## 🔑 Generate Secrets

```bash
# JWT Secret (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# API Key (64 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🧪 Test Security

### Test Rate Limiting
```bash
# Should block after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:3000/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test Authentication
```bash
# Should return 401
curl http://localhost:3000/api/orders

# Should return 200
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN"
```

### Test XSS Protection
```bash
# XSS should be sanitized
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"<script>alert(1)</script>"}'
```

---

## 📊 Rate Limit Tiers

| Tier | Window | Max | Use Case |
|------|--------|-----|----------|
| **Auth** | 15 min | 5 | Login, register |
| **Read** | 1 min | 200 | GET endpoints |
| **Write** | 1 min | 30 | POST/PUT/DELETE |
| **API** | 1 min | 100 | General API |

---

## ⚡ Middleware Order

**Correct order** for security middleware:

```typescript
app.use(express.json());           // 1. Parse JSON
app.use(securityHeaders);          // 2. Security headers
app.use(corsMiddleware);           // 3. CORS
app.use(sanitize);                 // 4. Sanitization
app.use(apiRateLimit());           // 5. Rate limiting
app.use('/api/protected', requireAuth);  // 6. Authentication
```

---

## 🚨 Security Checklist

### Before Production:
- [ ] All secrets in environment variables
- [ ] HTTPS enabled and enforced
- [ ] Rate limiting on all routes
- [ ] Auth on protected endpoints
- [ ] Input sanitization enabled
- [ ] CORS whitelist configured
- [ ] Security headers applied
- [ ] Token blacklisting working
- [ ] Encryption key set
- [ ] API keys generated
- [ ] No secrets in logs
- [ ] Error messages generic
- [ ] `npm audit` clean

---

## 📖 Documentation

- **Full Guide**: [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md)
- **Security Model**: [services/auth-service/docs/system/security-model.md](../services/auth-service/docs/system/security-model.md)
- **Architecture**: [docs/ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 🆘 Security Contacts

- **Report Issues**: security@yourdomain.com
- **On-Call**: +1-555-SECURITY
- **Bug Bounty**: bugbounty@yourdomain.com

---

## 💡 Best Practices

### ✅ DO
- Use environment variables for secrets
- Validate all inputs
- Sanitize user content
- Keep dependencies updated
- Log security events (not sensitive data)
- Use TypeScript strict mode
- Test security features

### ❌ DON'T
- Commit secrets to git
- Trust user input
- Use `eval()` or `innerHTML`
- Store passwords in plain text
- Return detailed errors to clients
- Bypass security checks
- Log sensitive data

---

## 📚 Quick Links

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [Helmet.js Docs](https://helmetjs.github.io/)
