#!/bin/bash

# Shopping App - Check Services Status

set -e

# Load port configuration
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$SOURCE_DIR/scripts/ports.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Shopping App - Service Status       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}\n"

# Function to check service health
check_service() {
    local name=$1
    local port=$2
    
    if curl -s -f "http://localhost:$port/health" > /dev/null 2>&1; then
        local response=$(curl -s "http://localhost:$port/health")
        echo -e "${GREEN}✅ $name (port $port)${NC}"
        echo -e "   $response" | jq '.' 2>/dev/null || echo "   $response"
    else
        echo -e "${RED}❌ $name (port $port) - Not responding${NC}"
    fi
    echo ""
}

# Check Docker containers
echo -e "${YELLOW}📦 Docker Infrastructure:${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "auth-db|product-db|order-db|payment-db|inventory-db|notification-db|redis|kafka|zookeeper" || echo -e "${RED}No containers running${NC}"
echo ""

# Check microservices
echo -e "${YELLOW}🚀 Microservices:${NC}\n"
check_service "API Gateway" $SERVICE_API_GATEWAY_PORT
check_service "Auth Service" $SERVICE_AUTH_PORT
check_service "Product Service" $SERVICE_PRODUCT_PORT
check_service "Order Service" $SERVICE_ORDER_PORT
check_service "Cart Service" $SERVICE_CART_PORT
check_service "Payment Service" $SERVICE_PAYMENT_PORT
check_service "Inventory Service" $SERVICE_INVENTORY_PORT
check_service "Notification Service" $SERVICE_NOTIFICATION_PORT

# Check Kafka UI
echo -e "${YELLOW}🎛️  Kafka UI:${NC}"
if curl -s -f "http://localhost:8080" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ http://localhost:8080${NC}\n"
else
    echo -e "${RED}❌ Not accessible${NC}\n"
fi

# Show log file sizes
echo -e "${YELLOW}📝 Log Files:${NC}"
if [ -d "logs" ]; then
    ls -lh logs/*.log 2>/dev/null || echo -e "${YELLOW}No log files found${NC}"
else
    echo -e "${YELLOW}No logs directory${NC}"
fi

echo -e "\n${BLUE}════════════════════════════════════════${NC}\n"
