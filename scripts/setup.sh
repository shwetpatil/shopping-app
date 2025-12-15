#!/bin/bash

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
echo "   - PostgreSQL (Auth):    localhost:5432"
echo "   - PostgreSQL (Product): localhost:5433"
echo "   - PostgreSQL (Order):   localhost:5434"
echo "   - Redis:                localhost:6379"
echo "   - Kafka:                localhost:9093"
echo "   - Kafka UI:             http://localhost:8080"
echo ""
echo "Application Services:"
echo "   - API Gateway:          http://localhost:3000"
echo "   - Auth Service:         http://localhost:3001"
echo "   - Product Service:      http://localhost:3002"
echo "   - Order Service:        http://localhost:3003
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
echo "   - PostgreSQL (Auth):    localhost:5432"
echo "   - PostgreSQL (Product): localhost:5433"
echo "   - PostgreSQL (Order):   localhost:5434"
echo "   - Redis:                localhost:6379"
echo "   - Kafka:                localhost:9093"
echo "   - Kafka UI:             http://localhost:8080"
echo ""
echo "🚀 To start the services:"
echo "   pnpm dev"
echo ""
echo "📊 To view Prisma Studio:"
echo "   cd services/auth-service && pnpm prisma:studio"
