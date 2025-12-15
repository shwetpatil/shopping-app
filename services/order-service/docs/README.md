# Order Service Documentation

Welcome to the Order Service documentation. This service handles the complete order lifecycle from creation to fulfillment in the shopping application.

## Quick Links

### System Documentation
- [Overview](./system/overview.md) - Service purpose, capabilities, and boundaries
- [Architecture](./system/architecture.md) - Technical architecture and design patterns
- [Data Flow](./system/data-flow.md) - Order lifecycle and event flows
- [Security Model](./system/security-model.md) - Authentication and authorization
- [Observability](./system/observability.md) - Logging, metrics, and monitoring
- [Performance](./system/performance.md) - Performance optimization strategies
- [Deployment](./system/deployment.md) - Deployment procedures
- [Environment Strategy](./system/environment-strategy.md) - Environment configurations
- [Failure Recovery](./system/failure-recovery.md) - Incident response procedures
- [Backup & Restore](./system/backup-restore.md) - Data backup procedures
- [Disaster Recovery](./system/disaster-recovery.md) - DR planning
- [Capacity Planning](./system/capacity-planning.md) - Scaling strategies
- [SLA/SLO](./system/sla-slo.md) - Service level commitments
- [Glossary](./system/glossary.md) - Terms and definitions

### Architecture Decision Records (ADR)
- [ADR-0001: Technology Stack](./adr/0001-tech-stack.md)
- [ADR-0002: Database and ORM](./adr/0002-database-orm.md)
- [ADR-0003: Event-Driven Architecture](./adr/0003-authentication.md)
- [ADR-0004: API Design](./adr/0004-api-design.md)
- [ADR-0005: Deployment Strategy](./adr/0005-deployment-strategy.md)

### Development Guides
- [Onboarding](./development/onboarding.md) - New developer guide
- [Local Setup](./development/local-setup.md) - Local development setup
- [Coding Standards](./development/coding-standards.md) - Code standards
- [Branching & Release](./development/branching-release.md) - Git workflow
- [Debugging](./development/debugging.md) - Debugging guide
- [Feature Flags](./development/feature-flags.md) - Feature flags
- [Conventions](./development/conventions.md) - Project conventions

### Operations
- [Runbooks](./operations/runbooks.md) - Operational procedures
- [Incident Management](./operations/incident-management.md) - Incident handling
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - Monitoring setup
- [Secrets Management](./operations/secrets-management.md) - Secrets handling
- [Audit Logging](./operations/audit-logging.md) - Audit procedures

## Service Overview

**Port**: 3003  
**Database**: PostgreSQL (port 5434)  
**Message Broker**: Kafka  
**Purpose**: Order lifecycle management and event coordination

### Key Features
- Order creation and management
- Order status tracking (PENDING → CONFIRMED → SHIPPED → DELIVERED → CANCELLED)
- Event-driven integration with payment, inventory, and notification services
- Order history and tracking
- Order cancellation handling
- Real-time order updates via Kafka events

### API Endpoints
```
POST   /api/orders             - Create new order
GET    /api/orders             - List user's orders
GET    /api/orders/:id         - Get order details
PATCH  /api/orders/:id/cancel  - Cancel order
PATCH  /api/orders/:id/ship    - Mark as shipped (Admin)
```

### Technology Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 16 with Prisma ORM
- **Message Broker**: Apache Kafka
- **Event Library**: KafkaJS

### Event Types Published
- `order.placed` - New order created
- `order.confirmed` - Order confirmed after payment
- `order.shipped` - Order shipped to customer
- `order.delivered` - Order delivered
- `order.cancelled` - Order cancelled

### Event Types Consumed
- `payment.authorized` - Payment successful
- `payment.failed` - Payment failed
- `inventory.reserved` - Stock reserved

### Database Schema
- **orders**: Order information
- **order_items**: Individual items in order
- **order_status_history**: Status change tracking

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- PostgreSQL
- Kafka (via Docker Compose)

### Quick Start
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start Kafka (if not running)
docker-compose up -d kafka zookeeper

# Start development server
npm run dev

# Service available at http://localhost:3003
```

### Event Flow Example
```
1. User creates order → order.placed event
2. Inventory reserves stock → inventory.reserved event
3. Payment processes → payment.authorized event
4. Order confirmed → order.confirmed event
5. Admin ships → order.shipped event
6. Delivery confirmed → order.delivered event
```

## Order State Machine

```
PENDING ──payment.authorized──> CONFIRMED ──admin.action──> SHIPPED ──tracking──> DELIVERED
   │                                │
   └──payment.failed/user.action──> CANCELLED
```

## Integration Points

- **Cart Service**: Retrieves cart items for order
- **Product Service**: Validates products and prices
- **Payment Service**: Processes payment
- **Inventory Service**: Reserves and confirms stock
- **Notification Service**: Sends order notifications

## Contributing

Please read our [Coding Standards](./development/coding-standards.md) and [Branching Strategy](./development/branching-release.md).

## Support

- **Team**: Orders Team
- **Slack**: #order-service
- **On-Call**: PagerDuty
- **Email**: orders-team@example.com

---

**Version**: 1.0.0  
**Status**: Production Ready
