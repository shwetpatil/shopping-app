#!/bin/bash

# Test Products MFE -> API Gateway -> Product Service Integration

echo "🧪 Testing Products Integration"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_GATEWAY="http://localhost:4000"
PRODUCT_SERVICE="http://localhost:4002"

# Test 1: Product Service Health
echo -e "${BLUE}1. Testing Product Service Health (Direct)${NC}"
response=$(curl -s -w "\n%{http_code}" "${PRODUCT_SERVICE}/health")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$ d')

if [ "$status" = "200" ]; then
  echo -e "${GREEN}✓ Product Service is healthy${NC}"
  echo "  Response: $body"
else
  echo -e "${RED}✗ Product Service not responding (Status: $status)${NC}"
fi
echo ""

# Test 2: API Gateway Health
echo -e "${BLUE}2. Testing API Gateway Health${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_GATEWAY}/health")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$ d')

if [ "$status" = "200" ]; then
  echo -e "${GREEN}✓ API Gateway is healthy${NC}"
  echo "  Response: $body"
else
  echo -e "${RED}✗ API Gateway not responding (Status: $status)${NC}"
fi
echo ""

# Test 3: Products via API Gateway (Public endpoint - no auth)
echo -e "${BLUE}3. Testing Products API via Gateway${NC}"
response=$(curl -s -w "\n%{http_code}" "${API_GATEWAY}/api/v1/products")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$ d')

if [ "$status" = "200" ]; then
  echo -e "${GREEN}✓ Products API accessible via Gateway${NC}"
  # Count products in response
  product_count=$(echo "$body" | grep -o '"id"' | wc -l)
  echo "  Status: $status"
  echo "  Products returned: $product_count"
  echo "  Sample response (first 200 chars): ${body:0:200}..."
else
  echo -e "${RED}✗ Products API failed (Status: $status)${NC}"
  echo "  Response: $body"
fi
echo ""

# Test 4: Direct Product Service call (for comparison)
echo -e "${BLUE}4. Testing Products API (Direct to Service)${NC}"
response=$(curl -s -w "\n%{http_code}" "${PRODUCT_SERVICE}/api/products")
status=$(echo "$response" | tail -n 1)
body=$(echo "$response" | sed '$ d')

if [ "$status" = "200" ]; then
  echo -e "${GREEN}✓ Products API accessible directly${NC}"
  product_count=$(echo "$body" | grep -o '"id"' | wc -l)
  echo "  Status: $status"
  echo "  Products returned: $product_count"
else
  echo -e "${RED}✗ Direct Products API failed (Status: $status)${NC}"
  echo "  Response: $body"
fi
echo ""

# Summary
echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Summary${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""
echo "Configuration:"
echo "  • Products MFE: http://localhost:3004"
echo "  • API Gateway: http://localhost:4000"
echo "  • Product Service: http://localhost:4002"
echo ""
echo "API Flow:"
echo "  Frontend (MFE) → API Gateway → Product Service"
echo "  http://localhost:3004 → http://localhost:4000/api/v1/products → http://localhost:4002/api/products"
echo ""
echo -e "${GREEN}✓ Integration test complete!${NC}"
