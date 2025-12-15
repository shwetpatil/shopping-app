# Phase 2 Setup Guide - Order & Payment Services

This guide walks you through setting up and running the Order Service, Payment Service, API Gateway, and Event Bus integration.

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Docker and Docker Compose
- Stripe account (for payment processing)
- All Phase 1 services running (Auth, Product)

## 🏗️ Architecture Overview

Phase 2 adds the following microservices:

- **Order Service** (Port 3003) - Order management, order tracking, status updates
- **Payment Service** (Port 3005) - Payment processing, Stripe integration, refunds
- **Cart Service** (Port 3006) - Shopping cart management
- **Inventory Service** (Port 3007) - Stock management, reservations
- **Notification Service** (Port 3008) - Email/SMS notifications
- **API Gateway** (Port 3000) - Single entry point, routing, authentication
- **Kafka Event Bus** (Port 9093) - Event-driven communication

## 🚀 Quick Start

### 1. Start Infrastructure

```bash
# Start all infrastructure services (PostgreSQL, Redis, Kafka, Zookeeper)
docker-compose up -d

# Wait for services to be healthy (check with docker ps)
docker ps --filter "name=shopping-app" --format "table {{.Names}}\t{{.Status}}"
```

### 2. Setup Environment Variables

Create `.env` files for each service from the `.env.example` templates:

```bash
# Copy all .env.example files to .env
for service in order-service payment-service cart-service inventory-service notification-service api-gateway; do
  cp services/$service/.env.example services/$service/.env
done
```

**Important:** Update the following in each `.env` file:

#### Payment Service `.env`
```env
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret
```

Get these from your [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

#### All Services - JWT Secret
Make sure all services use the **same** JWT_SECRET:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Install Dependencies

```bash
# Install all dependencies from project root
npm install
```

### 4. Database Migrations

Run Prisma migrations for all Phase 2 services:

```bash
# Order Service
cd services/order-service
npx prisma migrate dev --name init
npx prisma generate

# Payment Service
cd ../payment-service
npx prisma migrate dev --name init
npx prisma generate

# Cart Service
cd ../cart-service
npx prisma migrate dev --name init
npx prisma generate

# Inventory Service
cd ../inventory-service
npx prisma migrate dev --name init
npx prisma generate

# Notification Service
cd ../notification-service
npx prisma migrate dev --name init
npx prisma generate

# Return to root
cd ../..
```

### 5. Seed Databases

Seed all databases with test data (1,500+ records):

```bash
npm run db:seed:all
```

This will seed:
- 128 users (auth)
- 600 products with categories and brands
- 600 inventory items with stock levels
- Sample carts and orders

### 6. Start All Services

Open separate terminal windows for each service:

```bash
# Terminal 1: Order Service
cd services/order-service && npm run dev

# Terminal 2: Payment Service
cd services/payment-service && npm run dev

# Terminal 3: Cart Service
cd services/cart-service && npm run dev

# Terminal 4: Inventory Service
cd services/inventory-service && npm run dev

# Terminal 5: Notification Service
cd services/notification-service && npm run dev

# Terminal 6: API Gateway
cd services/api-gateway && npm run dev
```

Or use the provided script to start all services:

```bash
# From project root
./scripts/start-phase2-services.sh
```

## 🧪 Testing the Setup

### 1. Health Check

```bash
# API Gateway
curl http://localhost:3000/health

# Order Service
curl http://localhost:3003/health

# Payment Service
curl http://localhost:3005/health
```

### 2. Create an Order

First, login to get a JWT token:

```bash
# Login as customer
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123!"
  }'

# Save the token from response
export TOKEN="your_jwt_token_here"
```

Then create an order:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "productId": "product-id-from-database",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94105",
      "country": "USA"
    },
    "shippingMethod": "standard"
  }'
```

### 3. Create Payment Intent

```bash
curl -X POST http://localhost:3000/api/payments/intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "orderId": "order-id-from-previous-step",
    "amount": 100.00
  }'
```

### 4. Monitor Kafka Events

Access Kafka UI to see event flow:

```
http://localhost:8080
```

You should see topics like:
- `orders` - Order events (created, confirmed, shipped)
- `payments` - Payment events (authorized, captured, failed)
- `inventory` - Stock events (reserved, released)
- `notifications` - Notification events

## 📊 Service Ports Reference

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3000 | Main entry point |
| Auth Service | 3001 | Authentication |
| Product Service | 3002 | Product catalog |
| Order Service | 3003 | Order management |
| Payment Service | 3005 | Payment processing |
| Cart Service | 3006 | Shopping cart |
| Inventory Service | 3007 | Stock management |
| Notification Service | 3008 | Notifications |

## 🗄️ Database Ports

| Database | Port | Service |
|----------|------|---------|
| auth-db | 5432 | Auth Service |
| product-db | 5433 | Product Service |
| order-db | 5434 | Order Service |
| payment-db | 5435 | Payment Service |
| inventory-db | 5436 | Inventory Service |
| notification-db | 5437 | Notification Service |
| Redis | 6379 | Caching |
| Kafka | 9093 | Event Bus |
| Kafka UI | 8080 | Kafka Management |

## 🔄 Event-Driven Workflows

### Order Creation Flow

1. **User creates order** → Order Service
2. Order Service **publishes** `ORDER_CREATED` event
3. Inventory Service **consumes** event → reserves stock
4. Inventory Service **publishes** `STOCK_RESERVED` event
5. Notification Service **consumes** event → sends confirmation email
6. Payment Service listens for order events

### Payment Flow

1. **User initiates payment** → Payment Service
2. Payment Service creates Stripe payment intent
3. Frontend completes payment with Stripe
4. Stripe webhook → Payment Service
5. Payment Service **publishes** `PAYMENT_AUTHORIZED` event
6. Order Service **consumes** event → updates order status to CONFIRMED
7. Notification Service sends payment confirmation

## 🔍 Debugging

### Check Service Logs

```bash
# Order Service logs
cd services/order-service && npm run dev

# View Docker logs
docker-compose logs -f kafka
docker-compose logs -f redis
```

### Check Database

```bash
# Order database
npx prisma studio --schema services/order-service/prisma/schema.prisma

# Payment database
npx prisma studio --schema services/payment-service/prisma/schema.prisma
```

### Test Kafka Connection

```bash
# Connect to Kafka container
docker exec -it kafka bash

# List topics
kafka-topics --list --bootstrap-server localhost:9092

# Consume messages from a topic
kafka-console-consumer --bootstrap-server localhost:9092 --topic orders --from-beginning
```

## 🛠️ Common Issues

### Issue: Kafka connection fails

**Solution:** 
- Check Kafka is running: `docker ps | grep kafka`
- Restart Kafka: `docker-compose restart kafka zookeeper`
- Check Kafka logs: `docker-compose logs kafka`

### Issue: Database migration fails

**Solution:**
- Check database is running: `docker ps | grep db`
- Drop and recreate: `npx prisma migrate reset`
- Check DATABASE_URL in .env file

### Issue: Stripe webhook not working

**Solution:**
- Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
- Login: `stripe login`
- Forward webhooks: `stripe listen --forward-to localhost:3005/api/webhooks/stripe`
- Copy webhook secret to .env

### Issue: Services can't communicate

**Solution:**
- Verify all services are on same Docker network: `shopping-app-network`
- Check service URLs in .env files
- Use service names (e.g., `kafka:9092`) in Docker, `localhost:9093` on host

## 📚 API Documentation

### Order Service Endpoints

```
POST   /api/orders              - Create new order
GET    /api/orders              - List user orders
GET    /api/orders/:id          - Get order details
PATCH  /api/orders/:id/status   - Update order status
POST   /api/orders/:id/cancel   - Cancel order
GET    /api/orders/:id/tracking - Get order tracking
```

### Payment Service Endpoints

```
POST   /api/payments/intent          - Create payment intent
POST   /api/payments/:id/capture     - Capture authorized payment
POST   /api/payments/:id/refund      - Process refund
GET    /api/payments/order/:orderId  - Get payments by order
POST   /api/webhooks/stripe          - Stripe webhook handler
```

## 🎯 Next Steps

1. **Frontend Integration** - Update React apps to use new APIs
2. **Testing** - Write integration tests for order flow
3. **Monitoring** - Add Prometheus/Grafana for metrics
4. **Production** - Deploy to Kubernetes/AWS
5. **Security** - Add rate limiting, API keys, OAuth

## 🆘 Support

- Check [Architecture Decision Records](./architecture/adr/) for design decisions
- See [API Documentation](./API.md) for detailed endpoint specs
- Review [Database Schemas](./DATABASE_SCHEMAS.md) for data models
- Join team Slack channel for questions

---

**Built with ❤️ by the Shopping App Team**
