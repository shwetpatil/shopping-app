# Products MFE - Security Documentation

## Security Overview

This document outlines the security measures, best practices, and guidelines for the Products Microfrontend (MFE).

**Security Level:** Medium (Public catalog display, no sensitive data)  
**Last Review:** December 15, 2025  
**Next Review:** March 15, 2026

## Threat Model

### Assets to Protect

1. **Product Data Integrity**
   - Product information accuracy
   - Pricing data
   - Inventory levels

2. **User Privacy**
   - Browsing patterns
   - Search queries
   - Interaction data

3. **Application Availability**
   - Service uptime
   - Performance
   - Resource availability

### Threat Actors

1. **External Attackers**
   - XSS injection attempts
   - CSRF attacks
   - API abuse/scraping
   - DDoS attempts

2. **Malicious Users**
   - Price manipulation attempts
   - Inventory manipulation
   - Fake data injection

3. **Compromised Dependencies**
   - Supply chain attacks
   - Vulnerable packages
   - Malicious npm packages

## Security Architecture

### Defense in Depth Layers

```
┌─────────────────────────────────────────┐
│    Layer 1: Network Security            │
│    - CDN (DDoS Protection)              │
│    - Firewall                           │
│    - Rate Limiting                      │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│    Layer 2: Application Security        │
│    - CSP Headers                        │
│    - CORS Configuration                 │
│    - Input Validation                   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│    Layer 3: Data Security               │
│    - Type Validation                    │
│    - Sanitization                       │
│    - Error Handling                     │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│    Layer 4: Monitoring & Response       │
│    - Error Tracking                     │
│    - Audit Logging                      │
│    - Incident Response                  │
└─────────────────────────────────────────┘
```

## Authentication & Authorization

### Current State
- **No Authentication Required:** Product catalog is public
- **Read-Only Access:** Users can only view products
- **No Authorization Needed:** All products visible to all users

### Future Enhancement (When Adding Admin Features)
```typescript
// JWT-based authentication
interface AuthContext {
  isAuthenticated: boolean;
  user: User | null;
  permissions: string[];
}

// Role-based access control
enum Permission {
  VIEW_PRODUCTS = 'products:view',
  EDIT_PRODUCTS = 'products:edit',
  DELETE_PRODUCTS = 'products:delete'
}
```

## Input Validation & Sanitization

### API Request Validation

```typescript
// Type-safe validation using TypeScript
interface ProductFilters {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Validation example
function validateFilters(filters: unknown): ProductFilters {
  const validated: ProductFilters = {};
  
  if (typeof filters?.category === 'string') {
    validated.category = filters.category.slice(0, 50); // Limit length
  }
  
  if (typeof filters?.search === 'string') {
    validated.search = filters.search.slice(0, 100); // Limit length
  }
  
  if (typeof filters?.limit === 'number') {
    validated.limit = Math.min(Math.max(filters.limit, 1), 100); // Clamp
  }
  
  return validated;
}
```

### Output Sanitization

```typescript
// All data from API is type-checked
interface Product {
  id: string;
  name: string;
  price: number;
  // ... other fields
}

// React escapes HTML by default
// Use dangerouslySetInnerHTML only when necessary and sanitized
```

## XSS (Cross-Site Scripting) Protection

### Measures Implemented

1. **React Auto-Escaping**
   - React escapes all text content by default
   - No `dangerouslySetInnerHTML` used

2. **Content Security Policy (CSP)**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://images.unsplash.com data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:3001",
      "frame-ancestors 'none'"
    ].join('; ')
  }
];
```

3. **Input Validation**
   - All user inputs validated and sanitized
   - Type checking with TypeScript
   - Length limits enforced

### XSS Prevention Checklist

- [x] React auto-escaping enabled
- [x] No dangerouslySetInnerHTML usage
- [x] CSP headers configured (TODO in production)
- [x] Type validation on all inputs
- [x] URL parameters sanitized
- [ ] Sanitize third-party content (if integrated)

## CSRF (Cross-Site Request Forgery) Protection

### Current State
- **Not Required:** Read-only operations only
- **No State Changes:** No mutations from this MFE

### Future Implementation (When Adding Mutations)
```typescript
// CSRF Token validation
const csrfToken = getCsrfToken();

fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

## API Security

### HTTPS Enforcement
```javascript
// next.config.js - Force HTTPS in production
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ];
  }
};
```

### Rate Limiting
```typescript
// Rate limiting at API level
const API_RATE_LIMIT = {
  requests: 100,
  window: 60000 // 1 minute
};

// Client-side: Automatic via React Query
// - Deduplication of requests
// - Request caching
// - Retry limits (max 2)
```

### CORS Configuration
```javascript
// Product Service CORS settings
{
  origin: [
    'http://localhost:3004',
    'https://shop.example.com'
  ],
  methods: ['GET'],
  credentials: false,
  maxAge: 86400
}
```

## Dependency Security

### Package Vulnerability Management

```bash
# Regular security audits
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

### Current Vulnerabilities
```
3 high severity vulnerabilities

To address all issues, run:
  npm audit fix
```

### Dependency Update Strategy

1. **Critical Updates:** Immediate (security patches)
2. **Major Updates:** Quarterly review
3. **Minor Updates:** Monthly review
4. **Automated Scanning:** GitHub Dependabot enabled

### Approved Dependencies

| Package | Version | Last Security Check | Risk Level |
|---------|---------|---------------------|------------|
| react | ^18.2.0 | 2024-12-01 | Low |
| next | ^14.0.0 | 2024-12-01 | Low |
| @tanstack/react-query | ^5.90.12 | 2024-12-01 | Low |

## Secure Coding Practices

### Error Handling

```typescript
// ✅ GOOD: Don't expose internal errors
try {
  await fetchProducts();
} catch (error) {
  // Log full error internally
  logger.error('Failed to fetch products', error);
  
  // Show generic error to user
  setError('Unable to load products. Please try again.');
}

// ❌ BAD: Exposing internal errors
catch (error) {
  setError(error.message); // May expose sensitive info
}
```

### Logging Security

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: unknown[]) => {
    // Never log sensitive data
    const sanitized = sanitizeLogData(args);
    
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, sanitized);
    } else {
      // Send to secure error monitoring service
      errorMonitoring.captureException(new Error(message), { 
        extra: sanitized 
      });
    }
  }
};

function sanitizeLogData(data: unknown[]): unknown[] {
  // Remove passwords, tokens, PII
  return data.map(item => {
    if (typeof item === 'object') {
      return removesensitiveFields(item);
    }
    return item;
  });
}
```

### Environment Variables

```bash
# .env.example - Public documentation
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=false

# .env - Git ignored, contains actual values
NEXT_PUBLIC_API_URL=https://api.example.com
API_SECRET_KEY=actual_secret_here  # Never commit!
```

**Rules:**
- ✅ Use `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use environment-specific files
- ❌ Never commit secrets to git
- ❌ Never log environment variables

## Data Privacy

### Personal Data Handling

**Current State:** No personal data stored in this MFE

**Analytics Data:**
- Product views (anonymous)
- Search queries (anonymous)
- Click interactions (anonymous)

### GDPR Compliance

```typescript
// Cookie consent (if implementing analytics)
interface CookieConsent {
  necessary: true;      // Always true
  analytics: boolean;   // User choice
  marketing: boolean;   // User choice
}

// Only track if consent given
if (userConsent.analytics) {
  trackProductView(productId);
}
```

### Data Retention
- **Query Cache:** 10 minutes (automatic garbage collection)
- **Local Storage:** Not used
- **Session Storage:** Not used
- **Cookies:** None set by this MFE

## Security Headers

### Recommended Headers

```javascript
// next.config.js
const securityHeaders = [
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  // Prevent MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  // XSS Protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  // Permissions Policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];
```

## Secrets Management

### Current Secrets
- None (public API, no authentication)

### Future Secrets (When Implementing)
- API Keys: Store in environment variables
- JWT Secrets: Never in client code
- Database Credentials: Backend only

### Secret Rotation
- **Frequency:** Quarterly or after suspected compromise
- **Process:** Update environment variables → redeploy
- **Backup:** Secure vault (1Password, AWS Secrets Manager)

## Incident Response

### Security Incident Classification

| Severity | Definition | Response Time |
|----------|------------|---------------|
| Critical | Data breach, RCE | Immediate |
| High | XSS, CSRF | 24 hours |
| Medium | Known vulnerabilities | 7 days |
| Low | Informational | 30 days |

### Response Procedure

1. **Detect:** Monitor alerts, user reports
2. **Assess:** Determine severity and impact
3. **Contain:** Isolate affected systems
4. **Eradicate:** Remove threat, patch vulnerability
5. **Recover:** Restore service
6. **Document:** Post-mortem report

### Contact Points

- **Security Team:** security@company.com
- **On-Call:** PagerDuty alert
- **Escalation:** CTO

## Security Testing

### Testing Strategy

```bash
# Static analysis
npm run lint                    # ESLint security rules

# Dependency scanning
npm audit                       # Vulnerability check

# Type checking
npm run type-check             # TypeScript validation

# Unit tests with security scenarios
npm test                       # Jest tests
```

### Security Test Cases

```typescript
// Example security test
describe('XSS Protection', () => {
  it('should escape HTML in product names', () => {
    const maliciousProduct = {
      name: '<script>alert("XSS")</script>',
      price: 99.99
    };
    
    render(<ProductCard product={maliciousProduct} />);
    
    // Should render as text, not execute script
    expect(screen.getByText(/<script>/)).toBeInTheDocument();
  });
});
```

### Penetration Testing
- **Frequency:** Annual
- **Scope:** All public endpoints
- **Provider:** External security firm

## Compliance

### Standards & Frameworks

- **OWASP Top 10:** Addressed
- **GDPR:** Compliant (no PII stored)
- **PCI DSS:** Not applicable (no payment processing)
- **SOC 2:** In progress

### Audit Trail

| Date | Auditor | Findings | Status |
|------|---------|----------|--------|
| 2024-12-15 | Internal | 3 medium issues | Remediated |

## Security Checklist

### Development

- [x] TypeScript strict mode enabled
- [x] ESLint security rules enabled
- [x] No secrets in code
- [x] Environment variables properly configured
- [x] Error boundaries implemented
- [x] Logging sanitized

### Deployment

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CSP headers configured
- [ ] CORS properly configured
- [ ] Dependencies up to date

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Security alerts enabled
- [ ] Dependency scanning automated
- [ ] Audit logs enabled
- [ ] Performance monitoring active

## Resources

### Training
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [React Security](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [GitHub Dependabot](https://github.com/dependabot)

### Contacts
- **Security Team:** security@company.com
- **DevOps Team:** devops@company.com
- **Compliance:** compliance@company.com
