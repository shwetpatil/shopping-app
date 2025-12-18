#!/bin/bash

# CDN Cache Warming Script
# Pre-populates CDN cache with critical endpoints

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
API_URL=${API_URL:-"https://api.yourdomain.com"}
CONCURRENCY=${CONCURRENCY:-5}

echo -e "${GREEN}=== CDN Cache Warming Script ===${NC}\n"

# Critical endpoints to warm
ENDPOINTS=(
  "/api/v1/categories"
  "/api/v1/products?page=1&limit=20"
  "/api/v1/products?page=2&limit=20"
  "/api/v1/products?featured=true&limit=10"
  "/api/v1/brands"
)

# Fetch products to warm individual product pages
echo -e "${YELLOW}Fetching product list...${NC}"
PRODUCT_IDS=$(curl -s "${API_URL}/api/v1/products?limit=50" | jq -r '.data[].id' 2>/dev/null || echo "")

if [ -n "$PRODUCT_IDS" ]; then
  # Add product detail endpoints
  for id in $PRODUCT_IDS; do
    ENDPOINTS+=("/api/v1/products/${id}")
  done
fi

# Warm cache function
warm_endpoint() {
  local endpoint=$1
  local url="${API_URL}${endpoint}"
  
  response=$(curl -s -w "\n%{http_code}" -o /dev/null "$url" || echo "000")
  status=$(echo "$response" | tail -1)
  
  if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓${NC} ${endpoint}"
  else
    echo -e "${YELLOW}⚠${NC} ${endpoint} (Status: ${status})"
  fi
}

export -f warm_endpoint
export API_URL
export GREEN
export YELLOW
export NC

# Warm all endpoints with concurrency
echo -e "\n${YELLOW}Warming ${#ENDPOINTS[@]} endpoints with concurrency ${CONCURRENCY}...${NC}\n"

printf '%s\n' "${ENDPOINTS[@]}" | xargs -P "$CONCURRENCY" -I {} bash -c 'warm_endpoint "$@"' _ {}

echo -e "\n${GREEN}✓ Cache warming completed${NC}"
echo -e "${YELLOW}Note: First request populates cache, subsequent requests will be fast${NC}"
