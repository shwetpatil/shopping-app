#!/bin/bash

# Load port configuration
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SOURCE_DIR/scripts/ports.env"

echo "🚀 Starting Shopping App Development Environment..."

# Start Docker services
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null
then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Generate Prisma clients
echo "🔧 Generating Prisma clients..."

# Auth Service
cd services/auth-service
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
cd ../..

# Product Service
cd services/product-service
cp .en"
echo "Infrastructure:"
echo "   - PostgreSQL (Auth):    localhost:$INFRA_AUTH_DB_PORT"
echo "   - PostgreSQL (Product): localhost:$INFRA_PRODUCT_DB_PORT"
echo "   - PostgreSQL (Order):   localhost:$INFRA_ORDER_DB_PORT"
echo "   - Redis:                localhost:$INFRA_REDIS_PORT"
echo "   - Kafka:                localhost:$INFRA_KAFKA_EXTERNAL_PORT"
echo "   - Kafka UI:             http://localhost:$INFRA_KAFKA_UI_PORT"
echo ""
echo "Application Services:"
echo "   - API Gateway:          http://localhost:$SERVICE_API_GATEWAY_PORT"
echo "   - Auth Service:         http://localhost:$SERVICE_AUTH_PORT"
echo "   - Product Service:      http://localhost:$SERVICE_PRODUCT_PORT"
echo "   - Order Service:        http://localhost:$SERVICE_ORDER_PORT"
cd services/order-service
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
cd ../..

# API Gateway
cd services/api-gateway
cp .env.example .env
cd ../..

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📚 Available services:"
echo "   - PostgreSQL (Auth):    localhost:$INFRA_AUTH_DB_PORT"
echo "   - PostgreSQL (Product): localhost:$INFRA_PRODUCT_DB_PORT"
echo "   - PostgreSQL (Order):   localhost:$INFRA_ORDER_DB_PORT"
echo "   - Redis:                localhost:$INFRA_REDIS_PORT"
echo "   - Kafka:                localhost:$INFRA_KAFKA_EXTERNAL_PORT"
echo "   - Kafka UI:             http://localhost:$INFRA_KAFKA_UI_PORT"
echo ""
echo "🚀 To start the services:"
echo "   pnpm dev"
echo ""
echo "📊 To view Prisma Studio:"
echo "   cd services/auth-service && pnpm prisma:studio"
