# Phase 2 Quick Reference

## 🚀 Essential Commands

```bash
# Start everything
docker-compose up -d                    # Infrastructure
npm run db:seed:all                     # Seed databases (1,500+ records)
./scripts/start-phase2-services.sh      # All Phase 2 services

# Stop everything
./scripts/stop-phase2-services.sh       # Stop services
docker-compose down                     # Stop infrastructure

# Testing
./scripts/test-phase2-apis.sh           # Run API tests

# Database
cd services/order-service && npx prisma studio    # Order DB GUI
cd services/payment-service && npx prisma studio  # Payment DB GUI
```

## 🌐 Service URLs

```
API Gateway:          http://localhost:3000
Auth Service:         http://localhost:3001
Product Service:      http://localhost:3002
Order Service:        http://localhost:3003
Payment Service:      http://localhost:3005
Cart Service:         http://localhost:3006
Inventory Service:    http://localhost:3007
Notification Service: http://localhost:3008
Kafka UI:             http://localhost:8080
```

## 🔑 Test Accounts

```
Admin:    admin@example.com / Admin123!
Vendor:   vendor@example.com / Vendor123!
Customer: customer@example.com / Customer123!
```

## 📊 Database Ports

```
auth-db:          5432
product-db:       5433
order-db:         5434
payment-db:       5435
inventory-db:     5436
notification-db:  5437
Redis:            6379
Kafka:            9093
```

## 🔥 Common Workflows

### Create Order + Payment

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"Customer123!"}' \
  | jq -r '.data.token')

# 2. Get product
PRODUCT=$(curl -s http://localhost:3000/api/products?limit=1 \
  | jq -r '.data[0]')

# 3. Create order
ORDER=$(curl -s -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"items\": [{
      \"productId\": \"$(echo $PRODUCT | jq -r '.id')\",
      \"quantity\": 2
    }],
    \"shippingAddress\": {
      \"street\": \"123 Test St\",
      \"city\": \"San Francisco\",
      \"state\": \"CA\",
      \"zipCode\": \"94105\",
      \"country\": \"USA\"
    },
    \"shippingMethod\": \"standard\"
  }")

ORDER_ID=$(echo $ORDER | jq -r '.data.id')

# 4. Create payment intent
curl -X POST http://localhost:3000/api/payments/intent \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\", \"amount\": 100}"
```

## 📝 Key API Endpoints

### Orders
```
POST   /api/orders                 # Create order
GET    /api/orders                 # List orders
GET    /api/orders/:id             # Get order
POST   /api/orders/:id/cancel      # Cancel order
GET    /api/orders/:id/tracking    # Tracking info
```

### Payments
```
POST   /api/payments/intent        # Create payment intent
POST   /api/payments/:id/capture   # Capture payment
POST   /api/payments/:id/refund    # Refund payment
POST   /api/webhooks/stripe        # Stripe webhook
```

### Cart
```
GET    /api/cart                   # Get cart
POST   /api/cart/items             # Add item
PATCH  /api/cart/items/:id         # Update quantity
DELETE /api/cart/items/:id         # Remove item
```

## 🐛 Debugging

### Check Logs
```bash
# Service logs
tail -f services/logs/order-service.log
tail -f services/logs/payment-service.log

# Docker logs
docker-compose logs -f kafka
docker-compose logs -f redis
```

### Kafka Topics
```bash
# List topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Consume messages
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --from-beginning
```

### Database
```bash
# Connect to database
docker exec -it order-db psql -U postgres -d order_db

# Run migrations
cd services/order-service
npx prisma migrate dev

# Reset database
npx prisma migrate reset
```

## ⚡ Troubleshooting

### Services won't start
```bash
# Check if ports are available
lsof -i :3003  # Order Service
lsof -i :3005  # Payment Service

# Kill conflicting processes
kill -9 $(lsof -ti:3003)
```

### Kafka connection fails
```bash
# Restart Kafka
docker-compose restart kafka zookeeper

# Check Kafka health
docker exec -it kafka kafka-broker-api-versions \
  --bootstrap-server localhost:9092
```

### Database migration fails
```bash
# Check database is running
docker ps | grep db

# Drop and recreate
cd services/order-service
npx prisma migrate reset --force
```

### Stripe webhook not working
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks
stripe login
stripe listen --forward-to localhost:3005/api/webhooks/stripe

# Copy webhook secret to .env
# STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📚 Documentation

- [PHASE2_SETUP.md](./PHASE2_SETUP.md) - Complete setup guide
- [PHASE2_SUMMARY.md](./PHASE2_SUMMARY.md) - What's implemented
- [DATABASE_SEEDING.md](./DATABASE_SEEDING.md) - Seeding guide
- [ADRs](./architecture/adr/) - Architecture decisions

## 🎯 Quick Health Check

```bash
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3003/health  # Order Service
curl http://localhost:3005/health  # Payment Service
```

## 🔍 Monitor Events

Open Kafka UI: http://localhost:8080

Look for these topics:
- `orders` - Order events
- `payments` - Payment events
- `inventory` - Stock events
- `notifications` - Notification events

## 📊 View Databases

```bash
# Order database
cd services/order-service && npx prisma studio

# Payment database
cd services/payment-service && npx prisma studio

# Product database
cd services/product-service && npx prisma studio
```

---

**Need help?** See [PHASE2_SETUP.md](./PHASE2_SETUP.md) for detailed instructions.
