# Getting Started with Shopping App

This guide will help you set up the development environment and run the application locally.

## Prerequisites

Make sure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (Install: `npm install -g pnpm`)
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/))
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
cd /Users/siddharthy/Shweta-S/Learn/shopping-app
```

### 2. Run the Setup Script

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
- Start all Docker containers (PostgreSQL, Redis, Kafka)
- Install all dependencies
- Generate Prisma clients
- Run database migrations

### 3. Start the Services

```bash
# Start all services in development mode
pnpm dev
```

This will start:
- **Auth Service** on `http://localhost:3001`
- **Product Service** on `http://localhost:3002`

## Manual Setup (If needed)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Docker Containers

```bash
docker-compose up -d
```

Verify containers are running:
```bash
docker ps
```

### 3. Set Up Environment Variables

For each service, copy `.env.example` to `.env`:

```bash
# Auth Service
cd services/auth-service
cp .env.example .env

# Product Service
cd ../product-service
cp .env.example .env
```

### 4. Generate Prisma Clients and Run Migrations

```bash
# Auth Service
cd services/auth-service
pnpm prisma:generate
pnpm prisma:migrate

# Product Service
cd ../product-service
pnpm prisma:generate
pnpm prisma:migrate
```

### 5. Build Shared Packages

```bash
cd packages/common
pnpm build
```

## Available Services

### Infrastructure Services

| Service | Port | URL |
|---------|------|-----|
| Auth DB (PostgreSQL) | 5432 | localhost:5432 |
| Product DB (PostgreSQL) | 5433 | localhost:5433 |
| Order DB (PostgreSQL) | 5434 | localhost:5434 |
| Redis | 6379 | localhost:6379 |
| Kafka | 9093 | localhost:9093 |
| Kafka UI | 8080 | http://localhost:8080 |

### Application Services

| Service | Port | Health Check |
|---------|------|--------------|
| Auth Service | 3001 | http://localhost:3001/health |
| Product Service | 3002 | http://localhost:3002/health |

## Testing the Services

### 1. Test Auth Service

**Register a new user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 2. Test Product Service

**Create a product** (requires auth token):
```bash
curl -X POST http://localhost:3002/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Product",
    "slug": "test-product",
    "description": "A test product",
    "price": 29.99,
    "sku": "TEST-001"
  }'
```

**Get all products:**
```bash
curl http://localhost:3002/api/products
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all services in dev mode
pnpm dev

# Build all services
pnpm build

# Lint all code
pnpm lint

# Format all code
pnpm format

# Run tests
pnpm test

# Clean all build artifacts
pnpm clean
```

## Service-Specific Commands

### Auth Service

```bash
cd services/auth-service

# Start in dev mode
pnpm dev

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio
```

### Product Service

```bash
cd services/product-service

# Start in dev mode
pnpm dev

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio
```

## Troubleshooting

### Database Connection Issues

1. Check if Docker containers are running:
   ```bash
   docker ps
   ```

2. Check container logs:
   ```bash
   docker logs auth-db
   docker logs product-db
   ```

3. Restart containers:
   ```bash
   docker-compose restart
   ```

### Prisma Issues

1. Regenerate Prisma client:
   ```bash
   cd services/auth-service
   pnpm prisma:generate
   ```

2. Reset database (WARNING: This will delete all data):
   ```bash
   pnpm prisma migrate reset
   ```

### Port Conflicts

If ports are already in use, you can modify them in:
- `docker-compose.yml` for infrastructure services
- `.env` files for application services

### Clean Start

To start fresh:
```bash
# Stop and remove all containers
docker-compose down -v

# Clean all dependencies and build artifacts
pnpm clean
rm -rf node_modules
rm -rf services/*/node_modules
rm -rf packages/*/node_modules

# Start fresh
./scripts/setup.sh
```

## Next Steps

1. ✅ **You've successfully set up the base infrastructure!**
2. 📝 Explore the API endpoints using the Swagger docs (coming soon)
3. 🔧 Add more services (order-service, payment-service, etc.)
4. 🎨 Build the frontend with Next.js
5. 🚀 Set up CI/CD pipelines

## Project Structure

```
shopping-app/
├── packages/
│   └── common/              # Shared utilities, types, middleware
├── services/
│   ├── auth-service/        # Authentication & authorization
│   └── product-service/     # Product catalog management
├── apps/                    # Frontend applications (coming soon)
├── docker-compose.yml       # Local development infrastructure
├── package.json             # Root package configuration
└── pnpm-workspace.yaml      # Workspace configuration
```

## Need Help?

- Check the [README.md](README.md) for architecture overview
- Review service-specific README files
- Check container logs: `docker-compose logs -f`
- View Kafka messages: http://localhost:8080

Happy coding! 🚀
