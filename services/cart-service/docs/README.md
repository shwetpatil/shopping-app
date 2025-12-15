# Cart Service Documentation

Welcome to the Cart Service documentation. This service manages shopping carts with Redis-based storage for high performance and automatic expiration.

## Quick Links

### System Documentation
- [Overview](./system/overview.md) - Service capabilities and purpose
- [Architecture](./system/architecture.md) - Redis-based architecture
- [Data Flow](./system/data-flow.md) - Cart operations flow
- [Security Model](./system/security-model.md) - Security measures
- [Observability](./system/observability.md) - Monitoring and logging
- [Performance](./system/performance.md) - Performance optimization
- [Deployment](./system/deployment.md) - Deployment procedures
- [Environment Strategy](./system/environment-strategy.md) - Environment setup
- [Failure Recovery](./system/failure-recovery.md) - Recovery procedures
- [Backup & Restore](./system/backup-restore.md) - Data backup strategies
- [Disaster Recovery](./system/disaster-recovery.md) - DR planning
- [Capacity Planning](./system/capacity-planning.md) - Scaling strategies
- [SLA/SLO](./system/sla-slo.md) - Service levels
- [Glossary](./system/glossary.md) - Terminology

### Architecture Decision Records (ADR)
- [ADR-0001: Technology Stack](./adr/0001-tech-stack.md)
- [ADR-0002: Redis for Cart Storage](./adr/0002-database-orm.md)
- [ADR-0003: TTL Strategy](./adr/0003-authentication.md)
- [ADR-0004: API Design](./adr/0004-api-design.md)
- [ADR-0005: Deployment Strategy](./adr/0005-deployment-strategy.md)

### Development Guides
- [Onboarding](./development/onboarding.md) - Developer onboarding
- [Local Setup](./development/local-setup.md) - Local environment
- [Coding Standards](./development/coding-standards.md) - Code style
- [Branching & Release](./development/branching-release.md) - Git workflow
- [Debugging](./development/debugging.md) - Debugging tips
- [Feature Flags](./development/feature-flags.md) - Feature flags
- [Conventions](./development/conventions.md) - Conventions

### Operations
- [Runbooks](./operations/runbooks.md) - Operational guides
- [Incident Management](./operations/incident-management.md) - Incidents
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - Monitoring
- [Secrets Management](./operations/secrets-management.md) - Secrets
- [Audit Logging](./operations/audit-logging.md) - Auditing

## Service Overview

**Port**: 3004  
**Storage**: Redis  
**Purpose**: Shopping cart management with automatic expiration

### Key Features
- Add/remove items from cart
- Update item quantities
- Cart persistence with TTL (Time To Live)
- Guest cart support
- Cart merging on login
- Product price validation
- Real-time cart calculations

### API Endpoints
```
GET    /api/cart              - Get user's cart
POST   /api/cart/items        - Add item to cart
PUT    /api/cart/items/:id    - Update item quantity
DELETE /api/cart/items/:id    - Remove item from cart
DELETE /api/cart              - Clear cart
POST   /api/cart/merge        - Merge guest cart with user cart
```

### Technology Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Storage**: Redis 7+
- **Cache Client**: ioredis

### Data Model (Redis)

**Key Pattern**: `cart:userId:{userId}` or `cart:guest:{guestId}`

**Data Structure** (JSON):
```json
{
  "userId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 29.99,
      "name": "Product Name",
      "addedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 59.98,
  "itemCount": 2,
  "createdAt": "2024-01-01T11:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

**TTL (Time To Live)**:
- Authenticated users: 7 days
- Guest users: 1 day

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- Redis 7+

### Quick Start
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start Redis (if not running)
docker-compose up -d redis

# Start development server
npm run dev

# Service available at http://localhost:3004
```

### Testing
```bash
# Run tests
npm test

# Test Redis connection
redis-cli ping
# Expected: PONG
```

## Design Decisions

### Why Redis?
- **Performance**: Sub-millisecond response times
- **TTL Support**: Automatic cart expiration
- **Scalability**: Horizontal scaling with clustering
- **Persistence**: Optional RDB/AOF for durability

### TTL Strategy
- **7 days for users**: Extended shopping sessions
- **1 day for guests**: Encourage registration
- **Auto-expiration**: No manual cleanup needed
- **Renewable**: TTL resets on cart update

### Cart Merging
When a guest user logs in:
1. Retrieve guest cart
2. Retrieve user cart (if exists)
3. Merge items (combine quantities for duplicates)
4. Save to user cart
5. Delete guest cart

## Performance Characteristics

- **Read Latency**: <5ms (P95)
- **Write Latency**: <10ms (P95)
- **Throughput**: 10,000+ ops/sec
- **Memory**: ~1KB per cart
- **TTL Accuracy**: ±1 second

## Integration Points

- **Product Service**: Validates product IDs and prices
- **Order Service**: Retrieves cart for order creation
- **Auth Service**: User authentication for cart access

## Redis Configuration

```bash
# Production settings
maxmemory 2gb
maxmemory-policy allkeys-lru  # Evict least recently used keys
save 900 1                    # Snapshot every 15min if 1 change
save 300 10                   # Snapshot every 5min if 10 changes
appendonly yes                # Enable AOF persistence
```

## Monitoring

### Key Metrics
- Redis memory usage
- Hit/miss ratio
- Command latency
- Eviction rate
- Connection count

### Alerts
- Redis memory >90%
- Connection failures
- High latency (>50ms P95)
- Eviction rate spike

## Contributing

See [Coding Standards](./development/coding-standards.md) and [Branching Strategy](./development/branching-release.md).

## Support

- **Team**: Cart Team
- **Slack**: #cart-service
- **On-Call**: PagerDuty
- **Email**: cart-team@example.com

---

**Version**: 1.0.0  
**Status**: Production Ready
