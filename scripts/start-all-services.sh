#!/bin/bash

# Shopping App - Complete Service Startup Script
# This script starts all 8 microservices in sequence with health checks

set -e

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
if ! docker ps | grep -q "auth-db"; then
    echo -e "${RED}❌ Docker containers not running. Start with: docker-compose up -d${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker infrastructure is running${NC}\n"

# Check if services are already running
if check_port 3000 || check_port 3001 || check_port 3002 || check_port 3003 || \
   check_port 3004 || check_port 3005 || check_port 3006 || check_port 3007; then
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

start_service "Auth Service" 3001 "services/auth-service"
start_service "Product Service" 3002 "services/product-service"
start_service "Cart Service" 3004 "services/cart-service"
start_service "Order Service" 3003 "services/order-service"
start_service "Payment Service" 3005 "services/payment-service"
start_service "Inventory Service" 3006 "services/inventory-service"
start_service "Notification Service" 3007 "services/notification-service"
start_service "API Gateway" 3000 "services/api-gateway"

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ All Services Started Successfully${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

echo -e "${GREEN}📊 Service Status:${NC}"
echo -e "  API Gateway:          http://localhost:3000"
echo -e "  Auth Service:         http://localhost:3001"
echo -e "  Product Service:      http://localhost:3002"
echo -e "  Order Service:        http://localhost:3003"
echo -e "  Cart Service:         http://localhost:3004"
echo -e "  Payment Service:      http://localhost:3005"
echo -e "  Inventory Service:    http://localhost:3006"
echo -e "  Notification Service: http://localhost:3007"
echo -e "  Kafka UI:             http://localhost:8080"

echo -e "\n${GREEN}📝 Logs:${NC}"
echo -e "  tail -f logs/api-gateway.log"
echo -e "  tail -f logs/auth-service.log"
echo -e "  tail -f logs/product-service.log"

echo -e "\n${GREEN}🛑 Stop all services:${NC}"
echo -e "  ./scripts/stop-services.sh"

echo -e "\n${YELLOW}💡 Quick Test:${NC}"
echo -e "  curl http://localhost:3000/health"

echo -e "\n${GREEN}🎉 Ready to accept requests!${NC}\n"
