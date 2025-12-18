#!/bin/bash

# Shopping App - Stop All Services Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping all services...${NC}\n"

# Function to stop service by PID file
stop_service() {
    local name=$1
    local pid_file="logs/$name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}🔪 Stopping $name (PID: $pid)${NC}"
            kill $pid
            sleep 1
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${RED}   Force killing $name${NC}"
                kill -9 $pid
            fi
            rm "$pid_file"
            echo -e "${GREEN}✅ $name stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $name not running (stale PID file)${NC}"
            rm "$pid_file"
        fi
    else
        echo -e "${YELLOW}⚠️  No PID file for $name${NC}"
    fi
}

# Stop all services
stop_service "api-gateway"
stop_service "auth-service"
stop_service "product-service"
stop_service "order-service"
stop_service "cart-service"
stop_service "payment-service"
stop_service "inventory-service"
stop_service "notification-service"

# Kill any remaining Node processes running our services
echo -e "\n${YELLOW}🧹 Cleaning up any remaining processes...${NC}"
pkill -f "ts-node.*shopping-app" || true

echo -e "\n${GREEN}✅ All services stopped${NC}"
echo -e "${YELLOW}💡 Start services again with: ./scripts/start-all-services.sh${NC}\n"
