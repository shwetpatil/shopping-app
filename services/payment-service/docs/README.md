# Payment Service Documentation

Welcome to the Payment Service documentation. This service handles payment processing with Stripe integration, webhooks, and event-driven architecture.

## Quick Links

### System Documentation
- [Overview](./system/overview.md) - Service purpose and capabilities
- [Architecture](./system/architecture.md) - Stripe integration architecture
- [Data Flow](./system/data-flow.md) - Payment flows and webhooks
- [Security Model](./system/security-model.md) - PCI compliance and security
- [Observability](./system/observability.md) - Monitoring and logging
- [Performance](./system/performance.md) - Performance optimization
- [Deployment](./system/deployment.md) - Deployment procedures
- [Environment Strategy](./system/environment-strategy.md) - Environment setup
- [Failure Recovery](./system/failure-recovery.md) - Recovery procedures
- [Backup & Restore](./system/backup-restore.md) - Data backup
- [Disaster Recovery](./system/disaster-recovery.md) - DR planning
- [Capacity Planning](./system/capacity-planning.md) - Scaling
- [SLA/SLO](./system/sla-slo.md) - Service levels
- [Glossary](./system/glossary.md) - Terminology

### Architecture Decision Records (ADR)
- [ADR-0001: Technology Stack](./adr/0001-tech-stack.md)
- [ADR-0002: Stripe as Payment Provider](./adr/0002-database-orm.md)
- [ADR-0003: Idempotency Strategy](./adr/0003-authentication.md)
- [ADR-0004: API Design](./adr/0004-api-design.md)
- [ADR-0005: Deployment Strategy](./adr/0005-deployment-strategy.md)

### Development Guides
- [Onboarding](./development/onboarding.md) - Developer guide
- [Local Setup](./development/local-setup.md) - Local setup
- [Coding Standards](./development/coding-standards.md) - Standards
- [Branching & Release](./development/branching-release.md) - Workflow
- [Debugging](./development/debugging.md) - Debugging
- [Feature Flags](./development/feature-flags.md) - Features
- [Conventions](./development/conventions.md) - Conventions

### Operations
- [Runbooks](./operations/runbooks.md) - Operations
- [Incident Management](./operations/incident-management.md) - Incidents
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - Monitoring
- [Secrets Management](./operations/secrets-management.md) - Secrets
- [Audit Logging](./operations/audit-logging.md) - Auditing

## Service Overview

**Port**: 3005  
**Database**: PostgreSQL (port 5435)  
**Payment Provider**: Stripe  
**Message Broker**: Kafka  
**Purpose**: Secure payment processing and transaction management

### Key Features
- Payment intent creation and processing
- Stripe webhook handling
- Payment status tracking
- Idempotency to prevent duplicate charges
- Payment refunds
- Event-driven integration
- PCI-compliant payment handling

### API Endpoints
```
POST   /api/payments/intents        - Create payment intent
GET    /api/payments/:id            - Get payment status
POST   /api/payments/:id/refund     - Refund payment
POST   /api/webhooks/stripe         - Stripe webhook handler (no auth)
```

### Technology Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 16 with Prisma ORM
- **Payment Provider**: Stripe SDK v14+
- **Message Broker**: Apache Kafka

### Event Types Published
- `payment.initiated` - Payment process started
- `payment.authorized` - Payment successful
- `payment.failed` - Payment failed
- `payment.captured` - Payment captured
- `payment.refunded` - Payment refunded

### Event Types Consumed
- `order.placed` - New order created, initiate payment

### Database Schema
- **payments**: Payment records
- **payment_status_history**: Status change tracking
- **idempotency_logs**: Duplicate request prevention

## Idempotency

Prevents duplicate charges using idempotency keys:

```typescript
// Client sends idempotency key in header
POST /api/payments/intents
Idempotency-Key: uuid-v4

// Service checks idempotency_logs table
// If key exists, return cached response
// If new, process payment and store result
```

**Idempotency Window**: 24 hours

## Stripe Integration

### Payment Flow

```
1. Order created → order.placed event
2. Payment service creates Stripe PaymentIntent
3. Client completes payment on frontend
4. Stripe sends webhook to /api/webhooks/stripe
5. Webhook verified and processed
6. Payment status updated
7. payment.authorized event published
```

### Webhook Events Handled
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `charge.captured`

### Webhook Security
- Stripe signature verification
- Timestamp validation
- Replay attack prevention

```typescript
const signature = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  STRIPE_WEBHOOK_SECRET
);
// Event is verified ✓
```

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- PostgreSQL
- Kafka
- Stripe account (test mode)

### Stripe Setup
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard
3. Set up webhook endpoint
4. Configure webhook secret

### Quick Start
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add Stripe keys to .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Run database migrations
npx prisma migrate dev

# Start Kafka
docker-compose up -d kafka

# Start development server
npm run dev

# Service available at http://localhost:3005
```

### Testing with Stripe

```bash
# Use Stripe test cards
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 0002

# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:3005/api/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded
```

## Security

### PCI Compliance
- **Never store** card numbers, CVV, or full PANs
- Use Stripe.js for client-side tokenization
- Stripe handles PCI compliance
- Only store Stripe payment IDs

### Best Practices
- Verify webhook signatures
- Use HTTPS only
- Rotate API keys regularly
- Log all payment operations
- Monitor for fraud

## Error Handling

### Payment Failures
- Insufficient funds
- Card declined
- Expired card
- Network errors
- Stripe API downtime

### Recovery Strategies
- Automatic retry with exponential backoff
- Manual retry via admin panel
- Customer notification
- Alternative payment methods

## Monitoring

### Key Metrics
- Payment success rate
- Payment processing time
- Webhook delivery success
- Idempotency hit rate
- Stripe API latency

### Alerts
- Payment success rate <95%
- Webhook signature failures
- High payment failure rate
- Stripe API errors

## Integration Points

- **Order Service**: Receives order.placed events
- **Inventory Service**: Payment success triggers stock confirmation
- **Notification Service**: Payment events trigger emails
- **Stripe**: External payment processing

## Contributing

See [Coding Standards](./development/coding-standards.md) and [Branching Strategy](./development/branching-release.md).

## Support

- **Team**: Payments Team
- **Slack**: #payment-service
- **On-Call**: PagerDuty (Critical - money involved!)
- **Email**: payments-team@example.com
- **Stripe Support**: https://support.stripe.com

---

**Version**: 1.0.0  
**Status**: Production Ready  
**PCI Compliance**: Level 1 (via Stripe)
