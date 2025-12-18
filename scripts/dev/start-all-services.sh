#!/bin/bash

# Shopping App - Complete Service Startup Script
# This script starts all 8 microservices in sequence with health checks

set -e

# Load port configuration
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SOURCE_DIR/scripts/ports.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Shopping App - Starting All Services${NC}\n"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Function to wait for service health
wait_for_service() {
    local name=$1
    local port=$2
    local max_attempts=30
    local attempt=0

    echo -e "${YELLOW}⏳ Waiting for $name (port $port) to be healthy...${NC}"
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is healthy${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done

    echo -e "${RED}❌ $name failed to start${NC}"
    return 1
}

# Check if Docker containers are running
echo -e "${YELLOW}📦 Checking Docker infrastructure...${NC}"
if ! docker ps | grep -q "product-db"; then
    echo -e "${RED}❌ Docker containers not running. Start with: docker compose up -d${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker infrastructure is running${NC}\n"

# Check if services are already running
if check_port $SERVICE_API_GATEWAY_PORT || check_port $SERVICE_AUTH_PORT || check_port $SERVICE_PRODUCT_PORT || check_port $SERVICE_ORDER_PORT || \
   check_port $SERVICE_CART_PORT || check_port $SERVICE_PAYMENT_PORT || check_port $SERVICE_INVENTORY_PORT || check_port $SERVICE_NOTIFICATION_PORT; then
    echo -e "${YELLOW}⚠️  Some services are already running${NC}"
    echo -e "${YELLOW}Kill existing services? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🔪 Killing existing Node processes...${NC}"
        pkill -f "ts-node" || true
        sleep 2
    else
        echo -e "${RED}❌ Aborted${NC}"
        exit 1
    fi
fi

# Create logs directory
mkdir -p logs

# Function to start a service
start_service() {
    local name=$1
    local port=$2
    local path=$3

    echo -e "\n${YELLOW}🚀 Starting $name on port $port...${NC}"
    
    cd "$path"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env not found, copying from .env.example${NC}"
        cp .env.example .env
    fi
    
    # Start service in background
    nohup pnpm dev > "../../logs/$name.log" 2>&1 &
    local pid=$!
    echo $pid > "../../logs/$name.pid"
    
    cd - > /dev/null
    
    # Wait for service to be healthy
    wait_for_service "$name" "$port"
}

# Start services in order
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   Starting Microservices${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

start_service "Auth Service" $SERVICE_AUTH_PORT "services/auth-service"
start_service "Product Service" $SERVICE_PRODUCT_PORT "services/product-service"
start_service "Cart Service" $SERVICE_CART_PORT "services/cart-service"
start_service "Order Service" $SERVICE_ORDER_PORT "services/order-service"
start_service "Payment Service" $SERVICE_PAYMENT_PORT "services/payment-service"
start_service "Inventory Service" $SERVICE_INVENTORY_PORT "services/inventory-service"
start_service "Notification Service" $SERVICE_NOTIFICATION_PORT "services/notification-service"
start_service "API Gateway" $SERVICE_API_GATEWAY_PORT "services/api-gateway"

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ All Services Started Successfully${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${GREEN}📊 Service Status:${NC}"
echo -e "  API Gateway:          http://localhost:$SERVICE_API_GATEWAY_PORT"
echo -e "  Auth Service:         http://localhost:$SERVICE_AUTH_PORT"
echo -e "  Product Service:      http://localhost:$SERVICE_PRODUCT_PORT"
echo -e "  Order Service:        http://localhost:$SERVICE_ORDER_PORT"
echo -e "  Cart Service:         http://localhost:$SERVICE_CART_PORT"
echo -e "  Payment Service:      http://localhost:$SERVICE_PAYMENT_PORT"
echo -e "  Inventory Service:    http://localhost:$SERVICE_INVENTORY_PORT"
echo -e "  Notification Service: http://localhost:$SERVICE_NOTIFICATION_PORT"
echo -e "  Kafka UI:             http://localhost:$INFRA_KAFKA_UI_PORT"

echo -e "\n${GREEN}📝 Logs:${NC}"
echo -e "  tail -f logs/api-gateway.log"
echo -e "  tail -f logs/auth-service.log"
echo -e "  tail -f logs/product-service.log"

echo -e "\n${GREEN}🛑 Stop all services:${NC}"
echo -e "  ./scripts/stop-services.sh"

echo -e "\n${YELLOW}💡 Quick Test:${NC}"
echo -e "  curl http://localhost:$SERVICE_API_GATEWAY_PORT/health"

echo -e "\n${GREEN}🎉 Ready to accept requests!${NC}\n"
