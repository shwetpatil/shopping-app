#!/bin/bash

# Seed all databases with test data
# This script seeds all microservices databases with realistic test data

set -e

echo "🌱 Starting database seeding for all services..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if @faker-js/faker is installed
echo "📦 Checking dependencies..."
if ! npm list @faker-js/faker --depth=0 &> /dev/null; then
  echo "${YELLOW}Installing @faker-js/faker...${NC}"
  npm install -D @faker-js/faker
fi

if ! npm list tsx --depth=0 &> /dev/null; then
  echo "${YELLOW}Installing tsx for TypeScript execution...${NC}"
  npm install -D tsx
fi

# Function to seed a service
seed_service() {
  local service_name=$1
  local service_path="services/${service_name}"
  
  echo ""
  echo "🔄 Seeding ${service_name}..."
  echo "----------------------------------------"
  
  if [ ! -d "${service_path}" ]; then
    echo "${RED}❌ Service directory not found: ${service_path}${NC}"
    return 1
  fi
  
  cd "${service_path}"
  
  # Check if seed file exists
  if [ ! -f "prisma/seed.ts" ]; then
    echo "${YELLOW}⚠️  No seed file found for ${service_name}, skipping...${NC}"
    cd ../..
    return 0
  fi
  
  # Generate Prisma client
  echo "   Generating Prisma client..."
  npx prisma generate
  
  # Run migrations
  echo "   Running migrations..."
  npx prisma migrate deploy || npx prisma db push
  
  # Run seed
  echo "   Running seed script..."
  npx tsx prisma/seed.ts
  
  cd ../..
  
  echo "${GREEN}✅ ${service_name} seeded successfully${NC}"
}

# Seed services in order (dependencies first)
echo ""
echo "Starting seed process..."
echo "================================================"

# 1. Auth service (users needed for other services)
seed_service "auth-service"

# 2. Product service (products needed for inventory, orders, etc.)
seed_service "product-service"

# 3. Inventory service (depends on products)
seed_service "inventory-service"

# 4. Order service (depends on products and users)
seed_service "order-service"

# 5. Payment service (depends on orders)
seed_service "payment-service"

# 6. Notification service
seed_service "notification-service"

echo ""
echo "================================================"
echo "${GREEN}✅ All services seeded successfully!${NC}"
echo ""
echo "📊 Summary:"
echo "   - auth-service: ~128 users (3 test users + 125 random)"
echo "   - product-service: ~600 products, ~45 categories, ~40 brands"
echo "   - inventory-service: ~600 inventory records, ~200 transactions"
echo "   - order-service: (if implemented)"
echo "   - payment-service: (if implemented)"
echo "   - notification-service: (if implemented)"
echo ""
echo "🔐 Test User Credentials:"
echo "   Admin: admin@example.com / Admin123!"
echo "   Vendor: vendor@example.com / Vendor123!"
echo "   Customer: customer@example.com / Customer123!"
echo ""
echo "💡 You can now start testing your application with realistic data!"
