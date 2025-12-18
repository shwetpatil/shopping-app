#!/bin/bash

# CDN Cache Purge Script
# Usage: ./purge-cdn-cache.sh [cloudflare|cloudfront|all] [pattern]

set -e

PROVIDER=${1:-all}
PATTERN=${2:-"*"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Function to purge Cloudflare cache
purge_cloudflare() {
  echo -e "${YELLOW}Purging Cloudflare cache...${NC}"
  
  if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}Error: CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN must be set${NC}"
    return 1
  fi

  if [ "$PATTERN" = "*" ]; then
    # Purge everything
    curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data '{"purge_everything":true}'
  else
    # Purge specific files
    curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "{\"files\":[\"https://api.yourdomain.com${PATTERN}\"]}"
  fi
  
  echo -e "${GREEN}✓ Cloudflare cache purged${NC}"
}

# Function to purge CloudFront cache
purge_cloudfront() {
  echo -e "${YELLOW}Purging CloudFront cache...${NC}"
  
  if [ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo -e "${RED}Error: CLOUDFRONT_DISTRIBUTION_ID must be set${NC}"
    return 1
  fi

  # Create invalidation
  aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/${PATTERN}" \
    --output json

  echo -e "${GREEN}✓ CloudFront invalidation created${NC}"
}

# Function to purge Vercel cache
purge_vercel() {
  echo -e "${YELLOW}Purging Vercel cache...${NC}"
  
  if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo -e "${RED}Error: VERCEL_TOKEN and VERCEL_PROJECT_ID must be set${NC}"
    return 1
  fi

  # Trigger revalidation
  curl -X POST "https://api.vercel.com/v1/projects/${VERCEL_PROJECT_ID}/revalidate" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"paths\":[\"${PATTERN}\"]}"

  echo -e "${GREEN}✓ Vercel cache purged${NC}"
}

# Main execution
echo -e "${GREEN}=== CDN Cache Purge Script ===${NC}"
echo -e "Provider: ${PROVIDER}"
echo -e "Pattern: ${PATTERN}\n"

case $PROVIDER in
  cloudflare)
    purge_cloudflare
    ;;
  cloudfront)
    purge_cloudfront
    ;;
  vercel)
    purge_vercel
    ;;
  all)
    purge_cloudflare || echo -e "${YELLOW}⚠ Cloudflare purge skipped${NC}"
    purge_cloudfront || echo -e "${YELLOW}⚠ CloudFront purge skipped${NC}"
    purge_vercel || echo -e "${YELLOW}⚠ Vercel purge skipped${NC}"
    ;;
  *)
    echo -e "${RED}Error: Unknown provider '${PROVIDER}'${NC}"
    echo "Usage: $0 [cloudflare|cloudfront|vercel|all] [pattern]"
    exit 1
    ;;
esac

echo -e "\n${GREEN}✓ Cache purge completed${NC}"
