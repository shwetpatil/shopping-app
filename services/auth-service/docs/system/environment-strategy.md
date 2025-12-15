# Environment Strategy

## Environment Tiers

### 1. Development (Local)

**Purpose**: Individual developer workstations

**Configuration**:
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/auth_db_dev
JWT_SECRET=dev-secret-key-not-for-production
REFRESH_TOKEN_SECRET=dev-refresh-secret
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:3000
```

**Characteristics**:
- Hot reload enabled (nodemon)
- Debug logging
- Local PostgreSQL instance
- No rate limiting
- Mock external services
- Test data seeding enabled

**Access**: All developers

---

### 2. Testing / CI

**Purpose**: Automated testing in CI/CD pipeline

**Configuration**:
```bash
NODE_ENV=test
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/auth_db_test
JWT_SECRET=test-secret-key
REFRESH_TOKEN_SECRET=test-refresh-secret
LOG_LEVEL=error
```

**Characteristics**:
- In-memory or containerized database
- Minimal logging
- Fast test execution
- Isolated test data
- No external dependencies

**Access**: CI/CD pipeline only

---

### 3. Staging

**Purpose**: Pre-production testing and QA

**Configuration**:
```bash
NODE_ENV=staging
PORT=3001
DATABASE_URL=postgresql://user:password@staging-db.internal:5432/auth_db_staging
JWT_SECRET=${STAGING_JWT_SECRET}  # From secrets manager
REFRESH_TOKEN_SECRET=${STAGING_REFRESH_TOKEN_SECRET}
LOG_LEVEL=info
ALLOWED_ORIGINS=https://staging.example.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Characteristics**:
- Production-like infrastructure
- Staging database (separate from prod)
- Production logging levels
- Rate limiting enabled
- Real integrations (test accounts)
- Performance monitoring
- SSL/TLS enabled

**Access**: QA team, developers

---

### 4. Production

**Purpose**: Live customer-facing environment

**Configuration**:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${PROD_DATABASE_URL}  # From secrets manager
JWT_SECRET=${PROD_JWT_SECRET}
REFRESH_TOKEN_SECRET=${PROD_REFRESH_TOKEN_SECRET}
LOG_LEVEL=info
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=10
```

**Characteristics**:
- High availability (multi-zone)
- Auto-scaling enabled
- Full monitoring and alerting
- Backup and disaster recovery
- SSL/TLS enforced
- Rate limiting strict
- Performance optimized
- Security hardened

**Access**: Operations team only (via deployment pipeline)

---

## Configuration Management

### Environment Variables

#### Required Variables
```bash
# Core
NODE_ENV=production|staging|development|test
PORT=3001

# Database
DATABASE_URL=postgresql://...

# Security
JWT_SECRET=<min 32 characters>
REFRESH_TOKEN_SECRET=<min 32 characters>

# Application
LOG_LEVEL=error|warn|info|debug
ALLOWED_ORIGINS=comma,separated,origins
```

#### Optional Variables
```bash
# Performance
BCRYPT_ROUNDS=10
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=https://...
PROMETHEUS_PORT=9090

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_PASSWORD_RESET=true
```

### Secrets Management

#### Development
```bash
# .env file (not committed)
JWT_SECRET=dev-secret-key
DATABASE_URL=postgresql://localhost:5432/dev_db
```

#### Staging/Production

**AWS Secrets Manager**:
```bash
# Retrieve secrets at runtime
aws secretsmanager get-secret-value \
  --secret-id auth-service/prod/jwt-secret \
  --query SecretString \
  --output text
```

**Kubernetes Secrets**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-service-secrets
type: Opaque
data:
  jwt-secret: <base64-encoded>
  database-url: <base64-encoded>
```

**HashiCorp Vault**:
```bash
# Read secret
vault kv get secret/auth-service/prod/jwt-secret

# Inject into container
vault agent -config=vault-agent.hcl
```

### Configuration Hierarchy

```
1. Default values (code)
2. Environment-specific config file (.env.production)
3. Environment variables (process.env)
4. Secrets manager (AWS/Vault)
5. Runtime overrides (Kubernetes ConfigMap)
```

**Priority**: Runtime > Secrets Manager > Env Vars > Config File > Defaults

## Database Strategy

### Development
```yaml
Type: PostgreSQL local instance or Docker container
Size: Single instance
Backup: Not required
Data: Seed data, test fixtures
Migrations: Auto-applied on startup
```

### Testing
```yaml
Type: In-memory SQLite or test container
Size: Ephemeral per test run
Backup: Not required
Data: Test fixtures only
Migrations: Fresh database per run
```

### Staging
```yaml
Type: Managed PostgreSQL (RDS, Cloud SQL)
Size: db.t3.medium (2 vCPU, 4 GB RAM)
Backup: Daily automated backups (7-day retention)
Data: Sanitized production copy or synthetic data
Migrations: Applied via deployment pipeline
```

### Production
```yaml
Type: Managed PostgreSQL with replication
Size: db.r5.large (2 vCPU, 16 GB RAM) or larger
Backup: Automated daily + point-in-time recovery
Data: Real customer data (PII protected)
Migrations: Blue-green or canary deployment
High Availability: Multi-AZ with read replicas
```

## Deployment Pipeline

```
┌──────────────┐
│ Development  │  Developer commit
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   CI Build   │  npm test, lint, security scan
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Test Deploy  │  Deploy to test environment
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Integration  │  Automated integration tests
│    Tests     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Staging    │  Deploy to staging (auto)
│   Deploy     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  QA Testing  │  Manual testing, smoke tests
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Manual     │  Team lead approval
│  Approval    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Production   │  Blue-green deployment
│   Deploy     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Monitoring  │  Post-deployment validation
└──────────────┘
```

## Environment-Specific Features

### Development
- Swagger/OpenAPI documentation
- GraphQL playground
- Database query logging
- Hot module reloading
- Detailed error stack traces

### Staging
- Same as production minus:
  - Reduced replica count
  - Smaller database instance
  - Less aggressive auto-scaling

### Production
- Maximum security hardening
- Full observability stack
- Auto-scaling enabled
- Multi-region deployment (future)
- CDN integration

## Environment Validation

### Startup Checks
```typescript
function validateEnvironment() {
  const required = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET'
  ];
  
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  // Validate JWT secret length
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  // Validate database connection
  await prisma.$queryRaw`SELECT 1`;
}
```

### Health Checks
```typescript
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  };
  
  res.json(checks);
});
```

## Environment Promotion

### Promoting to Staging
```bash
# 1. Merge feature branch to develop
git checkout develop
git merge feature/my-feature

# 2. CI pipeline automatically deploys to staging
# (triggered by commit to develop branch)

# 3. Run smoke tests
npm run test:e2e -- --env=staging
```

### Promoting to Production
```bash
# 1. Create release branch
git checkout -b release/v1.2.0

# 2. Update version
npm version 1.2.0

# 3. Merge to main
git checkout main
git merge release/v1.2.0

# 4. Tag release
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0

# 5. CI pipeline requires manual approval before production deploy

# 6. Monitor deployment
kubectl rollout status deployment/auth-service -n production
```

## Troubleshooting by Environment

### Development
```bash
# View logs
npm run dev

# Connect to database
psql postgresql://localhost:5432/auth_db_dev

# Debug with breakpoints
node --inspect-brk ./dist/server.js
```

### Staging/Production
```bash
# View logs
kubectl logs -n shopping-app -l app=auth-service --tail=100

# Connect to database (via bastion)
psql $DATABASE_URL

# Port forward for debugging
kubectl port-forward -n shopping-app svc/auth-service 3001:3001

# Check environment variables
kubectl exec -n shopping-app deploy/auth-service -- env | grep -E 'NODE_ENV|JWT'
```

## Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for each environment
3. **Validate environment** on startup
4. **Document all variables** in README
5. **Rotate secrets** regularly (every 90 days)
6. **Audit access** to production secrets
7. **Test in staging** before production
8. **Automate deployments** to reduce human error
9. **Monitor environment health** continuously
10. **Have rollback plan** for each environment
