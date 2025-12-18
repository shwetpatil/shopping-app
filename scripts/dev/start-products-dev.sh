#!/bin/bash

# Simple script to start just the services needed for Products MFE
# Usage: ./start-products-dev.sh

# Load centralized port configuration
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${SOURCE_DIR}/scripts/ports.env"

echo "🚀 Starting Products MFE Development Environment"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check and start infrastructure if needed
echo -e "${BLUE}Checking infrastructure...${NC}"

# Check Redis
if ! lsof -i :${INFRA_REDIS_PORT} | grep -q LISTEN; then
  echo -e "${YELLOW}✗ Redis not running, starting...${NC}"
  docker compose up -d redis
  sleep 2
fi
echo -e "${GREEN}✓ Redis is running${NC}"

# Check Product DB
if ! lsof -i :${INFRA_PRODUCT_DB_PORT} | grep -q LISTEN; then
  echo -e "${YELLOW}✗ PostgreSQL (Product DB) not running, starting...${NC}"
  docker compose up -d product-db
  sleep 3
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Kill any existing services on these ports
echo -e "${BLUE}Cleaning up existing processes...${NC}"
lsof -ti :${SERVICE_PRODUCT_PORT} | xargs kill -9 2>/dev/null || true
lsof -ti :${SERVICE_API_GATEWAY_PORT} | xargs kill -9 2>/dev/null || true
sleep 1
echo -e "${GREEN}✓ Ports cleared${NC}"
echo ""

# Start Product Service
echo -e "${BLUE}Starting Product Service (port ${SERVICE_PRODUCT_PORT})...${NC}"
cd services/product-service
pnpm dev > /tmp/product-service.log 2>&1 &
PRODUCT_PID=$!
echo -e "${GREEN}✓ Product Service started (PID: $PRODUCT_PID)${NC}"
cd ../..

# Wait for Product Service to start
sleep 3

# Start API Gateway
echo -e "${BLUE}Starting API Gateway (port ${SERVICE_API_GATEWAY_PORT})...${NC}"
cd services/api-gateway
pnpm dev > /tmp/api-gateway.log 2>&1 &
GATEWAY_PID=$!
echo -e "${GREEN}✓ API Gateway started (PID: $GATEWAY_PID)${NC}"
cd ../..

# Wait for services to fully start
echo ""
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 5

# Check if services are responding
echo ""
echo -e "${BLUE}Verifying services...${NC}"

if curl -s http://localhost:${SERVICE_PRODUCT_PORT}/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Product Service: http://localhost:${SERVICE_PRODUCT_PORT}/health${NC}"
else
  echo -e "${RED}✗ Product Service not responding${NC}"
  echo "  Check logs: tail -f /tmp/product-service.log"
fi

if curl -s http://localhost:${SERVICE_API_GATEWAY_PORT}/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ API Gateway: http://localhost:${SERVICE_API_GATEWAY_PORT}/health${NC}"
else
  echo -e "${RED}✗ API Gateway not responding${NC}"
  echo "  Check logs: tail -f /tmp/api-gateway.log"
fi

echo ""
echo -e "${GREEN}✨ Backend services are ready!${NC}"
echo ""
echo "📊 Services:"
echo "  • Product Service:  http://localhost:${SERVICE_PRODUCT_PORT}"
echo "  • API Gateway:      http://localhost:${SERVICE_API_GATEWAY_PORT}"
echo ""
echo "📝 Logs:"
echo "  • Product Service:  tail -f /tmp/product-service.log"
echo "  • API Gateway:      tail -f /tmp/api-gateway.log"
echo ""
echo "🎯 Next step:"
echo "  Start Products MFE:  cd apps/mfe-products && pnpm dev"
echo "  Then open:           http://localhost:${MFE_PRODUCTS_PORT}"
echo ""
echo "🛑 To stop services:"
echo "  kill $PRODUCT_PID $GATEWAY_PID"
echo ""
