#!/bin/bash

# Stop all Phase 2 services

set -e

echo "🛑 Stopping Phase 2 Services..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Function to stop a service
stop_service() {
  local service_name=$1
  local pid_file="services/logs/${service_name}.pid"
  
  if [ -f "$pid_file" ]; then
    local pid=$(cat "$pid_file")
    if ps -p "$pid" > /dev/null 2>&1; then
      echo -e "Stopping ${service_name} (PID: $pid)..."
      kill "$pid" 2>/dev/null || true
      sleep 1
      # Force kill if still running
      if ps -p "$pid" > /dev/null 2>&1; then
        kill -9 "$pid" 2>/dev/null || true
      fi
      echo -e "${GREEN}✓ ${service_name} stopped${NC}"
    else
      echo -e "${RED}⚠ ${service_name} was not running${NC}"
    fi
    rm -f "$pid_file"
  else
    echo -e "${RED}⚠ No PID file found for ${service_name}${NC}"
  fi
}

# Stop all services
stop_service "API Gateway"
stop_service "Notification Service"
stop_service "Inventory Service"
stop_service "Cart Service"
stop_service "Payment Service"
stop_service "Order Service"

echo ""
echo -e "${GREEN}✅ All Phase 2 services stopped${NC}"
echo ""
echo "📝 Log files preserved in services/logs/"
echo "🐳 To stop infrastructure (Docker), run: docker-compose down"
