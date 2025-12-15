# Phase 3: Core Business Services Implementation

## Overview

Phase 3 completes the core e-commerce functionality by implementing Cart, Payment, Inventory, and Notification services with full event-driven integration.

## Services Implemented

### 1. Cart Service (Port 3004)

**Technology**: Express.js + Redis

**Features**:
- Redis-based shopping cart with TTL (7 days for authenticated users)
- Real-time price synchronization with Product Service
- Guest cart merging on user login
- Cart operations: add, update, remove, clear items
- Automatic cart expiration

**Key Components**:
- `CartService`: Business logic for cart operations
- `CartRepository`: Redis operations with TTL management
- `ProductService`: Validates products and fetches current prices

**Redis Keys**: `cart:{userId}`

**Endpoints**:
```
GET    /api/cart          - Get user cart
POST   /api/cart/items    - Add item to cart
PUT    /api/cart/items/:productId - Update item quantity
DELETE /api/cart/items/:productId - Remove item
DELETE /api/cart          - Clear cart
POST   /api/cart/merge    - Merge guest cart after login
```

### 2. Payment Service (Port 3005)

**Technology**: Express.js + PostgreSQL + Stripe + Kafka

**Features**:
- Stripe payment integration with payment intents
- Webhook handling for payment events
- Idempotency key support for safe retries
- Payment status tracking (PENDING → AUTHORIZED → CAPTURED)
- Refund processing (full and partial)
- Event-driven payment notifications

**Key Components**:
- `PaymentService`: Stripe integration and payment lifecycle
- `PaymentRepository`: Payment data persistence
- `WebhookController`: Stripe webhook validation and processing
- `EventPublisher`: Kafka event publishing
- `OrderEventConsumer`: Listens to order events

**Database Tables**:
- `payments`: Payment records with Stripe IDs
- `payment_status_history`: Status transition audit trail
- `idempotency_logs`: Prevents duplicate payment processing

**Kafka Events**:
- Consumes: `order.placed`, `order.cancelled`
- Publishes: `payment.authorized`, `payment.failed`, `payment.captured`, `payment.refunded`

**Endpoints**:
```
POST   /api/payments/intent         - Create payment intent
POST   /api/payments/capture        - Capture authorized payment
POST   /api/payments/refund         - Process refund
GET    /api/payments/:paymentId     - Get payment details
GET    /api/payments/order/:orderId - Get payment by order
POST   /api/webhooks/stripe         - Stripe webhook endpoint
```

### 3. Inventory Service (Port 3006)

**Technology**: Express.js + PostgreSQL + Kafka

**Features**:
- Stock reservation system with expiration (15 minutes)
- Automated reservation cleanup job
- Stock adjustment with transaction history
- Low stock alerts via Kafka events
- Event-driven inventory management

**Key Components**:
- `InventoryService`: Stock management and reservation logic
- `InventoryRepository`: Inventory and reservation data access
- `OrderEventConsumer`: Reserves stock on order placement
- `PaymentEventConsumer`: Confirms/releases reservations
- `ReservationCleanupJob`: Periodic cleanup of expired reservations
- `EventPublisher`: Low stock alerts

**Database Tables**:
- `inventory`: Product stock levels
- `stock_reservations`: Temporary stock holds
- `stock_transactions`: Audit trail for all stock changes

**Stock Flow**:
1. Order Placed → Reserve Stock (availableQuantity ↓, reservedQuantity ↑)
2. Payment Authorized → Confirm Reservation (reservedQuantity ↓, totalQuantity ↓)
3. Payment Failed/Order Cancelled → Release Reservation (availableQuantity ↑, reservedQuantity ↓)
4. Reservation Expired (15min) → Auto Release

**Kafka Events**:
- Consumes: `order.placed`, `order.cancelled`, `payment.authorized`, `payment.failed`
- Publishes: `inventory.reserved`, `inventory.released`, `inventory.low-stock`

**Endpoints**:
```
GET    /api/inventory                    - Get all inventory (Admin)
GET    /api/inventory/product/:productId - Get inventory for product
POST   /api/inventory                    - Create inventory record (Admin)
PUT    /api/inventory/:inventoryId       - Update inventory (Admin)
POST   /api/inventory/:inventoryId/adjust - Adjust stock (Admin)
GET    /api/inventory/:inventoryId/transactions - Get transaction history (Admin)
```

### 4. Notification Service (Port 3007)

**Technology**: Express.js + PostgreSQL + Kafka + Nodemailer + Handlebars

**Features**:
- Email notifications with HTML templates
- Event-driven notification triggers
- Template rendering with Handlebars
- Notification history tracking
- Low stock admin alerts

**Key Components**:
- `NotificationService`: Notification orchestration
- `EmailService`: SMTP integration with template rendering
- `OrderEventConsumer`: Order lifecycle notifications
- `PaymentEventConsumer`: Payment status notifications
- `InventoryEventConsumer`: Low stock alerts

**Email Templates**:
- `order-confirmation.hbs`: Sent when order is placed
- `order-shipped.hbs`: Sent when order ships
- `order-cancelled.hbs`: Sent when order is cancelled
- `payment-confirmation.hbs`: Sent when payment succeeds
- `low-stock-alert.hbs`: Sent to admins for low inventory

**Database Tables**:
- `notifications`: Notification records with delivery status
- `notification_templates`: Template definitions (extensible)

**Kafka Events**:
- Consumes: `order.placed`, `order.cancelled`, `order.shipped`, `payment.authorized`, `payment.failed`, `inventory.low-stock`

**Endpoints**:
```
GET /api/notifications              - Get user notifications
GET /api/notifications/:id          - Get notification details
GET /api/notifications/admin/all    - Get all notifications (Admin)
```

## Event Flow Diagrams

### Complete Order Flow with All Services

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Cart   │───▶│  Order  │───▶│Inventory│───▶│ Payment │
│ Service │    │ Service │    │ Service │    │ Service │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │               │              │
                    ▼               ▼              ▼
               ┌─────────────────────────────────────┐
               │          Kafka Event Bus            │
               └─────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Notification   │
                    │     Service      │
                    └──────────────────┘
```

### Detailed Order Processing Flow

```
1. Add to Cart (Cart Service)
   ├─ Store in Redis with TTL
   └─ Validate product prices

2. Create Order (Order Service)
   ├─ Publish: order.placed
   └─ Status: PENDING

3. Reserve Inventory (Inventory Service)
   ├─ Consume: order.placed
   ├─ Reserve stock (15min expiration)
   ├─ Publish: inventory.reserved
   └─ Update: availableQty ↓, reservedQty ↑

4. Create Payment (Payment Service)
   ├─ Generate Stripe payment intent
   ├─ Return client secret
   └─ Status: PENDING

5. Process Payment (Payment Service)
   ├─ Stripe webhook: payment_intent.succeeded
   ├─ Publish: payment.authorized
   └─ Status: AUTHORIZED

6. Confirm Reservation (Inventory Service)
   ├─ Consume: payment.authorized
   ├─ Finalize stock deduction
   └─ Update: reservedQty ↓, totalQty ↓

7. Send Notifications (Notification Service)
   ├─ Consume: order.placed → Order confirmation email
   ├─ Consume: payment.authorized → Payment confirmation
   └─ Consume: order.shipped → Shipping notification

8. Update Order Status (Order Service)
   ├─ Status: PAID → PROCESSING → SHIPPED → DELIVERED
   └─ Publish status change events
```

## Database Schemas

### Payment Service

```sql
payments:
  - id (UUID, PK)
  - orderId (UUID, unique)
  - userId (UUID)
  - amount (Decimal)
  - currency (VARCHAR)
  - status (ENUM: PENDING, PROCESSING, AUTHORIZED, CAPTURED, FAILED, CANCELLED, REFUNDED)
  - paymentMethod (ENUM)
  - stripePaymentId (VARCHAR, unique)
  - idempotencyKey (VARCHAR, unique)
  - metadata (JSON)
  - createdAt, updatedAt

payment_status_history:
  - id (UUID, PK)
  - paymentId (UUID, FK)
  - status (ENUM)
  - notes (TEXT)
  - createdAt

idempotency_logs:
  - id (UUID, PK)
  - idempotencyKey (VARCHAR, unique)
  - requestHash (TEXT)
  - responseData (JSON)
  - createdAt
```

### Inventory Service

```sql
inventory:
  - id (UUID, PK)
  - productId (UUID, unique)
  - sku (VARCHAR, unique)
  - availableQuantity (INT)
  - reservedQuantity (INT)
  - totalQuantity (INT)
  - reorderLevel (INT, default: 10)
  - reorderQuantity (INT, default: 50)
  - createdAt, updatedAt

stock_reservations:
  - id (UUID, PK)
  - inventoryId (UUID, FK)
  - orderId (UUID, unique)
  - userId (UUID)
  - quantity (INT)
  - status (ENUM: ACTIVE, EXPIRED, COMPLETED, CANCELLED)
  - expiresAt (TIMESTAMP)
  - completedAt (TIMESTAMP)
  - createdAt, updatedAt

stock_transactions:
  - id (UUID, PK)
  - inventoryId (UUID, FK)
  - type (VARCHAR: PURCHASE, SALE, RETURN, DAMAGE, ADJUSTMENT)
  - quantity (INT)
  - reference (VARCHAR)
  - notes (TEXT)
  - createdAt
```

### Notification Service

```sql
notifications:
  - id (UUID, PK)
  - userId (UUID)
  - type (ENUM: EMAIL, SMS, PUSH)
  - channel (VARCHAR)
  - subject (VARCHAR)
  - content (TEXT)
  - metadata (JSON)
  - status (ENUM: PENDING, SENT, FAILED, DELIVERED)
  - sentAt (TIMESTAMP)
  - deliveredAt (TIMESTAMP)
  - errorMessage (TEXT)
  - retryCount (INT)
  - createdAt, updatedAt

notification_templates:
  - id (UUID, PK)
  - name (VARCHAR, unique)
  - type (ENUM)
  - subject (VARCHAR)
  - template (TEXT)
  - variables (Array)
  - isActive (BOOLEAN)
  - createdAt, updatedAt
```

## Configuration

### Environment Variables

Each service requires:
- Database connection (PostgreSQL on different ports)
- Kafka brokers configuration
- Service-specific settings (Redis URL, Stripe keys, SMTP config)
- JWT secret for authentication

### Database Ports

- Payment DB: 5435
- Inventory DB: 5436
- Notification DB: 5437

### Service Ports

- Cart Service: 3004
- Payment Service: 3005
- Inventory Service: 3006
- Notification Service: 3007

## Setup Instructions

### 1. Install Dependencies

```bash
# From root directory
pnpm install
```

### 2. Setup Docker Infrastructure

```bash
# Start all databases, Redis, Kafka
docker-compose up -d

# Verify all containers are running
docker ps
```

### 3. Setup Environment Files

```bash
# Copy .env.example for each new service
cp services/cart-service/.env.example services/cart-service/.env
cp services/payment-service/.env.example services/payment-service/.env
cp services/inventory-service/.env.example services/inventory-service/.env
cp services/notification-service/.env.example services/notification-service/.env
```

### 4. Configure Stripe (Payment Service)

1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Update `.env`:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Configure Email (Notification Service)

**Option A: SendGrid**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<your-sendgrid-api-key>
```

**Option B: Gmail**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail>
SMTP_PASS=<app-password>
```

### 6. Run Database Migrations

```bash
# Payment Service
cd services/payment-service
pnpm prisma generate
pnpm prisma migrate dev

# Inventory Service
cd services/inventory-service
pnpm prisma generate
pnpm prisma migrate dev

# Notification Service
cd services/notification-service
pnpm prisma generate
pnpm prisma migrate dev
```

### 7. Start Services

```bash
# Terminal 1: Cart Service
cd services/cart-service && pnpm dev

# Terminal 2: Payment Service
cd services/payment-service && pnpm dev

# Terminal 3: Inventory Service
cd services/inventory-service && pnpm dev

# Terminal 4: Notification Service
cd services/notification-service && pnpm dev

# Also ensure these are running:
# - Auth Service (3001)
# - Product Service (3002)
# - Order Service (3003)
# - API Gateway (3000)
```

## Testing Guide

### 1. Cart Operations

```bash
# Login first
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# Add item to cart
curl -X POST http://localhost:3000/api/v1/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"<product-uuid>","quantity":2}'

# Get cart
curl http://localhost:3000/api/v1/cart \
  -H "Authorization: Bearer $TOKEN"

# Update item quantity
curl -X PUT http://localhost:3000/api/v1/cart/items/<product-uuid> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":3}'

# Remove item
curl -X DELETE http://localhost:3000/api/v1/cart/items/<product-uuid> \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Payment Flow

```bash
# Create order first
ORDER=$(curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId":"<uuid>","quantity":1,"price":99.99}],
    "shippingAddress": {
      "street":"123 Main St",
      "city":"Boston",
      "state":"MA",
      "zipCode":"02101",
      "country":"USA"
    }
  }')

ORDER_ID=$(echo $ORDER | jq -r '.data.id')

# Create payment intent
PAYMENT=$(curl -X POST http://localhost:3000/api/v1/payments/intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\":\"$ORDER_ID\",
    \"amount\":99.99,
    \"currency\":\"USD\",
    \"paymentMethod\":\"CREDIT_CARD\"
  }")

# Use clientSecret with Stripe.js on frontend
CLIENT_SECRET=$(echo $PAYMENT | jq -r '.data.clientSecret')
```

### 3. Inventory Management (Admin)

```bash
# Create inventory record
curl -X POST http://localhost:3000/api/v1/inventory \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId":"<product-uuid>",
    "sku":"PROD-001",
    "availableQuantity":100,
    "reorderLevel":20,
    "reorderQuantity":50
  }'

# Adjust stock
curl -X POST http://localhost:3000/api/v1/inventory/<inventory-id>/adjust \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity":50,
    "type":"PURCHASE",
    "reference":"PO-12345",
    "notes":"Restocked from supplier"
  }'

# Get inventory by product
curl http://localhost:3000/api/v1/inventory/product/<product-uuid> \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Notifications

```bash
# Get user notifications
curl http://localhost:3000/api/v1/notifications \
  -H "Authorization: Bearer $TOKEN"

# Get notification details
curl http://localhost:3000/api/v1/notifications/<notification-id> \
  -H "Authorization: Bearer $TOKEN"
```

## Event Testing

Use Kafka UI at http://localhost:8080 to monitor events:

1. **Order Placed Event** → Triggers inventory reservation + notification
2. **Payment Authorized Event** → Triggers inventory confirmation + notification
3. **Order Cancelled Event** → Triggers inventory release + notification
4. **Low Stock Event** → Triggers admin notification

## Architecture Highlights

### 1. Event-Driven Architecture

- **Loose Coupling**: Services communicate via Kafka events
- **Scalability**: Services can be scaled independently
- **Resilience**: Service failures don't cascade
- **Audit Trail**: All events are logged in Kafka

### 2. Idempotency

- **Payment Service**: Uses idempotency keys to prevent duplicate charges
- **Event Consumers**: Handle duplicate events gracefully

### 3. Data Consistency

- **Stock Reservations**: Time-bound holds with automatic cleanup
- **Transaction History**: Complete audit trail for all stock changes
- **Status History**: Track all payment and order status transitions

### 4. Reliability Features

- **Graceful Degradation**: Cart works even if Product Service is down
- **Retry Mechanisms**: Failed notifications can be retried
- **Reservation Expiry**: Prevents stock deadlock from abandoned carts

## Performance Considerations

### Cart Service
- Redis provides sub-millisecond response times
- Cart TTL prevents memory bloat
- Price refresh happens on cart retrieval

### Payment Service
- Idempotency prevents duplicate charges
- Webhooks provide async payment confirmation
- Stripe handles payment security

### Inventory Service
- Reservation cleanup job runs every minute
- Indexed queries for fast reservation lookups
- Transaction logging for audit compliance

### Notification Service
- Async email sending doesn't block API responses
- Template caching improves performance
- Failed notifications stored for retry

## Security Features

1. **Cart Service**: User isolation, JWT authentication
2. **Payment Service**: Stripe handles PCI compliance, webhook signature verification
3. **Inventory Service**: Admin-only write operations
4. **Notification Service**: User data isolation, template injection prevention

## Next Steps

1. **User Service**: Profile management, addresses, wishlist
2. **Search Service**: Elasticsearch integration for product search
3. **Review Service**: Product ratings and reviews
4. **Analytics Service**: Order analytics, user behavior tracking
5. **Admin Dashboard**: Comprehensive admin panel
6. **Frontend Application**: Next.js customer-facing app

## Monitoring & Observability

### Recommended Tools
- **Logging**: Winston (already configured)
- **Metrics**: Prometheus + Grafana
- **Tracing**: Jaeger for distributed tracing
- **APM**: New Relic or Datadog

### Key Metrics to Monitor
- Cart abandonment rate
- Payment success/failure rates
- Stock reservation timeouts
- Email delivery rates
- Service response times
- Kafka lag

## Troubleshooting

### Common Issues

**1. Redis Connection Failed**
```bash
# Check Redis is running
docker ps | grep redis
# Restart Redis
docker-compose restart redis
```

**2. Kafka Consumer Not Receiving Events**
```bash
# Check Kafka topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092
# Check consumer groups
docker exec -it kafka kafka-consumer-groups --list --bootstrap-server localhost:9092
```

**3. Email Not Sending**
- Verify SMTP credentials
- Check notification service logs
- Test with temporary service like Mailtrap

**4. Stock Not Releasing**
- Check reservation cleanup job logs
- Manually trigger cleanup if needed
- Verify Kafka connectivity

## Summary

Phase 3 completes the core e-commerce functionality with:
- ✅ **Cart Service**: Redis-based shopping cart with TTL
- ✅ **Payment Service**: Stripe integration with webhooks
- ✅ **Inventory Service**: Event-driven stock management
- ✅ **Notification Service**: Multi-channel notifications with templates

All services are fully integrated via Kafka events, providing a robust, scalable, and maintainable e-commerce platform.
