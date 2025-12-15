#!/bin/bash

# Phase 2 Services Startup Script
# Starts Order, Payment, Cart, Inventory, Notification, and API Gateway services

set -e

echo "🚀 Starting Phase 2 Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if infrastructure is running
echo -e "${BLUE}Checking infrastructure services...${NC}"
if ! docker ps | grep -q kafka; then
  echo -e "${YELLOW}⚠️  Kafka is not running. Starting infrastructure...${NC}"
  docker-compose up -d
  echo -e "${GREEN}✓ Infrastructure started. Waiting 30s for services to be ready...${NC}"
  sleep 30
else
  echo -e "${GREEN}✓ Infrastructure is running${NC}"
fi

echo ""
echo -e "${BLUE}Starting microservices...${NC}"
echo ""

# Function to start a service
start_service() {
  local service_name=$1
  local service_path=$2
  local port=$3
  
  echo -e "${BLUE}Starting ${service_name} on port ${port}...${NC}"
  cd "$service_path"
  
  # Check if .env exists
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      echo -e "${YELLOW}⚠️  No .env found, copying from .env.example${NC}"
      cp .env.example .env
    else
      echo -e "${YELLOW}⚠️  No .env.example found for ${service_name}${NC}"
    fi
  fi
  
  # Start the service in the background
  npm run dev > "../logs/${service_name}.log" 2>&1 &
  echo $! > "../logs/${service_name}.pid"
  
  cd - > /dev/null
  echo -e "${GREEN}✓ ${service_name} started (PID: $(cat services/logs/${service_name}.pid))${NC}"
}

# Create logs directory
mkdir -p services/logs

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Start services in order
start_service "Order Service" "${PROJECT_ROOT}/services/order-service" "3003"
sleep 2

start_service "Payment Service" "${PROJECT_ROOT}/services/payment-service" "3005"
sleep 2

start_service "Cart Service" "${PROJECT_ROOT}/services/cart-service" "3006"
sleep 2

start_service "Inventory Service" "${PROJECT_ROOT}/services/inventory-service" "3007"
sleep 2

start_service "Notification Service" "${PROJECT_ROOT}/services/notification-service" "3008"
sleep 2

start_service "API Gateway" "${PROJECT_ROOT}/services/api-gateway" "3000"
sleep 2

echo ""
echo -e "${GREEN}✨ All Phase 2 services started successfully!${NC}"
echo ""
echo "📊 Service Status:"
echo "  • Order Service:        http://localhost:3003"
echo "  • Payment Service:      http://localhost:3005"
echo "  • Cart Service:         http://localhost:3006"
echo "  • Inventory Service:    http://localhost:3007"
echo "  • Notification Service: http://localhost:3008"
echo "  • API Gateway:          http://localhost:3000"
echo ""
echo "📝 Logs location: services/logs/"
echo ""
echo "🛑 To stop all services, run: ./scripts/stop-phase2-services.sh"
echo ""
echo -e "${BLUE}Checking service health in 5 seconds...${NC}"
sleep 5

# Health check
echo ""
echo "🏥 Health Check Results:"
for service in "localhost:3003/health" "localhost:3005/health" "localhost:3000/health"; do
  if curl -s "http://$service" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $service - OK"
  else
    echo -e "  ${YELLOW}⚠${NC} $service - Not responding yet (may still be starting)"
  fi
done

echo ""
echo -e "${GREEN}🎉 Phase 2 setup complete! Ready to process orders and payments.${NC}"
