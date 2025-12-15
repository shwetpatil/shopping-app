# Inventory Service Documentation

Welcome to the Inventory Service documentation. This service manages stock levels, reservations, and inventory tracking with time-bound reservations and automatic cleanup.

## Quick Links

### System Documentation
- [Overview](./system/overview.md) - Service overview
- [Architecture](./system/architecture.md) - Architecture design
- [Data Flow](./system/data-flow.md) - Inventory flows
- [Security Model](./system/security-model.md) - Security
- [Observability](./system/observability.md) - Monitoring
- [Performance](./system/performance.md) - Performance
- [Deployment](./system/deployment.md) - Deployment
- [Environment Strategy](./system/environment-strategy.md) - Environments
- [Failure Recovery](./system/failure-recovery.md) - Recovery
- [Backup & Restore](./system/backup-restore.md) - Backups
- [Disaster Recovery](./system/disaster-recovery.md) - DR
- [Capacity Planning](./system/capacity-planning.md) - Scaling
- [SLA/SLO](./system/sla-slo.md) - SLAs
- [Glossary](./system/glossary.md) - Terms

### Architecture Decision Records (ADR)
- [ADR-0001: Technology Stack](./adr/0001-tech-stack.md)
- [ADR-0002: Time-Bound Reservations](./adr/0002-database-orm.md)
- [ADR-0003: Event-Driven Updates](./adr/0003-authentication.md)
- [ADR-0004: API Design](./adr/0004-api-design.md)
- [ADR-0005: Deployment Strategy](./adr/0005-deployment-strategy.md)

### Development Guides
- [Onboarding](./development/onboarding.md) - Onboarding
- [Local Setup](./development/local-setup.md) - Setup
- [Coding Standards](./development/coding-standards.md) - Standards
- [Branching & Release](./development/branching-release.md) - Workflow
- [Debugging](./development/debugging.md) - Debugging
- [Feature Flags](./development/feature-flags.md) - Flags
- [Conventions](./development/conventions.md) - Conventions

### Operations
- [Runbooks](./operations/runbooks.md) - Runbooks
- [Incident Management](./operations/incident-management.md) - Incidents
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - Monitoring
- [Secrets Management](./operations/secrets-management.md) - Secrets
- [Audit Logging](./operations/audit-logging.md) - Auditing

## Service Overview

**Port**: 3006  
**Database**: PostgreSQL (port 5436)  
**Message Broker**: Kafka  
**Purpose**: Stock management with time-bound reservations

### Key Features
- Stock level tracking (available, reserved, total)
- Time-bound reservations (15-minute expiry)
- Automatic reservation cleanup
- Stock transaction history
- Low stock alerts
- Event-driven stock updates
- Concurrency control

### API Endpoints
```
GET    /api/inventory/:productId        - Get stock levels
POST   /api/inventory/:productId        - Create/update inventory
POST   /api/inventory/reserve           - Reserve stock
POST   /api/inventory/confirm           - Confirm reservation
POST   /api/inventory/release           - Release reservation
POST   /api/inventory/adjust            - Adjust stock levels
GET    /api/inventory/transactions      - Get transaction history
```

### Technology Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 16 with Prisma ORM
- **Message Broker**: Apache Kafka
- **Background Jobs**: setInterval-based cleanup

### Event Types Published
- `inventory.reserved` - Stock reserved for order
- `inventory.confirmed` - Reservation confirmed
- `inventory.released` - Reservation released/expired
- `inventory.low-stock` - Stock below threshold

### Event Types Consumed
- `order.placed` - Reserve stock for new order
- `payment.authorized` - Confirm reservation
- `payment.failed` - Release reservation
- `order.cancelled` - Release reservation

### Database Schema

**inventory**:
- productId (unique)
- availableQuantity
- reservedQuantity
- totalQuantity
- lowStockThreshold
- updatedAt

**stock_reservations**:
- id
- productId
- orderId
- quantity
- expiresAt (indexed)
- status (ACTIVE/CONFIRMED/EXPIRED/CANCELLED)

**stock_transactions**:
- id
- productId
- type (RESERVE/CONFIRM/RELEASE/ADJUST/RESTOCK)
- quantity
- balanceBefore
- balanceAfter
- reason
- createdAt

## Reservation System

### Time-Bound Reservations

**Concept**: When an order is placed, stock is reserved for 15 minutes. If payment isn't completed, reservation auto-expires.

```typescript
// Reserve stock
reserve(productId, quantity, orderId) {
  // Check available stock
  if (available < quantity) throw InsufficientStockError;
  
  // Create reservation (expires in 15 minutes)
  reservation = {
    productId,
    orderId,
    quantity,
    expiresAt: now() + 15minutes,
    status: 'ACTIVE'
  };
  
  // Update quantities
  inventory.reservedQuantity += quantity;
  inventory.availableQuantity -= quantity;
}
```

### Reservation Lifecycle

```
1. Order placed → Reserve stock (15min timer)
2a. Payment succeeds → Confirm reservation (stock deducted)
2b. Payment fails → Release reservation (stock returned)
2c. Timer expires → Auto-release (cleanup job)
```

### Cleanup Job

Runs every 60 seconds to release expired reservations:

```typescript
setInterval(async () => {
  const expiredReservations = await findExpiredReservations();
  
  for (const reservation of expiredReservations) {
    await releaseReservation(reservation.id);
    await publishEvent('inventory.released', {
      reason: 'EXPIRED'
    });
  }
}, 60000); // 60 seconds
```

## Stock Calculations

```typescript
totalQuantity = availableQuantity + reservedQuantity + soldQuantity

// Example:
Total: 100 units
Available: 70 units (can be reserved)
Reserved: 20 units (pending payment)
Sold: 10 units (completed orders)
```

## Concurrency Control

### Optimistic Locking

```typescript
// Using Prisma optimistic locking
await prisma.inventory.update({
  where: {
    productId: id,
    version: currentVersion // Check version hasn't changed
  },
  data: {
    availableQuantity: newQuantity,
    version: currentVersion + 1
  }
});
```

### Transaction Isolation

```sql
-- Use serializable isolation for stock operations
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- Reserve stock operations
COMMIT;
```

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- PostgreSQL
- Kafka

### Quick Start
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed initial inventory
npm run seed

# Start Kafka
docker-compose up -d kafka

# Start development server (includes cleanup job)
npm run dev

# Service available at http://localhost:3006
```

### Seeding Test Data

```bash
# Create sample inventory
npm run seed:inventory

# Sample data:
# Product A: 100 units
# Product B: 50 units
# Product C: 25 units
```

## Monitoring

### Key Metrics
- Available stock by product
- Reservation count
- Expired reservation rate
- Stock adjustment frequency
- Low stock alerts
- Transaction throughput

### Alerts
- **Critical**: Stock unavailable for popular product
- **Warning**: Low stock (< threshold)
- **Info**: High reservation expiry rate
- **Critical**: Cleanup job failure

### Dashboard Panels
- Stock levels by product
- Reservation expiry rate
- Stock transaction timeline
- Low stock products

## Stock Adjustment

### Manual Adjustments
```typescript
POST /api/inventory/adjust
{
  "productId": "uuid",
  "quantity": 50, // Can be negative for write-offs
  "reason": "RESTOCK" | "DAMAGED" | "LOST" | "CORRECTION"
}
```

### Automatic Restocking
- Integrate with supplier APIs (future)
- Automatic reorder when low stock
- Purchase order generation

## Integration Points

- **Order Service**: Receives order.placed events
- **Payment Service**: Receives payment events
- **Product Service**: Syncs product inventory
- **Notification Service**: Low stock alerts

## Best Practices

1. **Always use reservations** for orders
2. **Set appropriate expiry times** (15min default)
3. **Monitor cleanup job** health
4. **Handle race conditions** with proper locking
5. **Log all stock transactions** for audit
6. **Alert on low stock** proactively
7. **Test concurrency scenarios** thoroughly

## Troubleshooting

### "Insufficient Stock" Errors
- Check reserved vs available quantities
- Look for stuck reservations
- Run cleanup job manually

### Stock Discrepancies
- Review transaction log
- Check for failed reservations
- Verify cleanup job running

### High Reservation Expiry Rate
- Indicates checkout abandonment
- Consider increasing expiry time
- Improve checkout UX

## Contributing

See [Coding Standards](./development/coding-standards.md).

## Support

- **Team**: Inventory Team
- **Slack**: #inventory-service
- **On-Call**: PagerDuty
- **Email**: inventory-team@example.com

---

**Version**: 1.0.0  
**Status**: Production Ready
