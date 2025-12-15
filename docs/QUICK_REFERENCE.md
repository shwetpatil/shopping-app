# 🚀 Quick Reference - Shopping App

## Services & Ports

| Service | URL | Health Check |
|---------|-----|--------------|
| **API Gateway** | http://localhost:3000 | http://localhost:3000/health |
| Auth Service | http://localhost:3001 | http://localhost:3001/health |
| Product Service | http://localhost:3002 | http://localhost:3002/health |
| Order Service | http://localhost:3003 | http://localhost:3003/health |
| Kafka UI | http://localhost:8080 | - |

## Quick Commands

```bash
# Setup everything
./scripts/setup.sh

# Start all services
pnpm dev

# Start Docker only
docker-compose up -d

# Stop Docker
docker-compose down

# View logs
docker-compose logs -f

# Rebuild everything
pnpm clean && pnpm install && pnpm build
```

## Essential API Calls

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123","firstName":"John","lastName":"Doe"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'
```

### 3. Create Product
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","slug":"test-product","price":29.99,"sku":"TEST-001"}'
```

### 4. Get Products
```bash
curl http://localhost:3000/api/v1/products
```

### 5. Create Order
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"productId":"PRODUCT_ID","quantity":1}],
    "shippingAddress":{"fullName":"John Doe","address":"123 St","city":"SF","state":"CA","postalCode":"94102","country":"USA","phone":"+1234567890"}
  }'
```

## Environment Setup

Each service needs `.env` file. Copy from `.env.example`:

```bash
# Auth Service
cd services/auth-service && cp .env.example .env

# Product Service  
cd services/product-service && cp .env.example .env

# Order Service
cd services/order-service && cp .env.example .env

# API Gateway
cd services/api-gateway && cp .env.example .env
```

## Database Operations

### Prisma Commands

```bash
# Generate client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio

# Reset database (⚠️ deletes all data)
pnpm prisma migrate reset
```

### Direct Database Access

```bash
# Auth DB
psql postgresql://postgres:postgres@localhost:5432/auth_db

# Product DB
psql postgresql://postgres:postgres@localhost:5433/product_db

# Order DB
psql postgresql://postgres:postgres@localhost:5434/order_db
```

## Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Restart service
docker-compose restart [service-name]

# Stop all
docker-compose down

# Remove volumes (⚠️ deletes all data)
docker-compose down -v

# View running containers
docker ps
```

## Kafka Operations

### View Topics
1. Open http://localhost:8080
2. Click "Topics"

### View Messages
1. Topics → Select topic (e.g., `order.placed`)
2. Click "Messages"
3. See real-time events

## Project Structure

```
shopping-app/
├── packages/common/          # Shared code
├── services/
│   ├── api-gateway/         # Port 3000
│   ├── auth-service/        # Port 3001
│   ├── product-service/     # Port 3002
│   └── order-service/       # Port 3003
└── docker-compose.yml
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check Docker containers
docker ps

# Restart database
docker-compose restart auth-db
```

### Prisma Client Not Generated
```bash
cd services/auth-service
pnpm prisma:generate
```

### Clean Start
```bash
docker-compose down -v
rm -rf services/*/dist
rm -rf packages/*/dist
./scripts/setup.sh
```

## File Locations

| What | Where |
|------|-------|
| Service code | `services/{service-name}/src/` |
| Shared code | `packages/common/src/` |
| Database schemas | `services/{service-name}/prisma/schema.prisma` |
| Environment configs | `services/{service-name}/.env` |
| Docker config | `docker-compose.yml` |

## Important URLs

- **API Gateway**: http://localhost:3000
- **Kafka UI**: http://localhost:8080
- **Prisma Studio** (Auth): `cd services/auth-service && pnpm prisma:studio`
- **Prisma Studio** (Product): `cd services/product-service && pnpm prisma:studio`
- **Prisma Studio** (Order): `cd services/order-service && pnpm prisma:studio`

## Documentation

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Project overview |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Detailed setup |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture details |
| [API_TESTING.md](API_TESTING.md) | API examples |
| [PHASE2_SUMMARY.md](PHASE2_SUMMARY.md) | Complete feature list |

## Next Steps

1. **Test the APIs** - Use [API_TESTING.md](API_TESTING.md)
2. **View Events** - Check Kafka UI at http://localhost:8080
3. **Explore Data** - Use Prisma Studio
4. **Add Services** - Payment, Cart, Notification
5. **Build Frontend** - Next.js application

## Need Help?

- Check service logs: `docker-compose logs -f [service-name]`
- Check application logs in terminal
- View Prisma Studio for database issues
- Check Kafka UI for event issues
- Review [GETTING_STARTED.md](GETTING_STARTED.md)
