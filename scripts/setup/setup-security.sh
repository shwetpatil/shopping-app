#!/bin/bash

# Security Setup Script for Shopping App
# This script installs dependencies and validates the security implementation

set -e

echo "🔒 Shopping App Security Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo "📦 Step 1: Installing security dependencies..."
cd packages/common
npm install ioredis@^5.3.2 helmet@^7.1.0 cors@^2.8.5 xss@^1.0.14 express-mongo-sanitize@^2.2.0 --save
npm install @types/cors@^2.8.17 --save-dev
cd ../..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo "🔑 Step 2: Generating security secrets..."
echo ""

# Generate JWT secret
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "JWT_SECRET=${JWT_SECRET}"

# Generate encryption key
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}"

# Generate API keys
API_KEY_1=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
API_KEY_2=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "API_KEY_1=${API_KEY_1}"
echo "API_KEY_2=${API_KEY_2}"

echo ""
echo -e "${YELLOW}⚠️  Save these secrets to your .env files!${NC}"
echo ""

# Create .env.security file
cat > .env.security << EOF
# Security Configuration
# Generated on $(date)

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Redis (for rate limiting and token blacklist)
REDIS_URL=redis://localhost:6379

# CORS Configuration
CORS_WHITELIST=http://localhost:3000,http://localhost:3001,https://yourdomain.com
CORS_ALLOW_ALL=false

# API Keys (comma-separated)
API_KEYS=${API_KEY_1},${API_KEY_2}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Security
NODE_ENV=development
BCRYPT_ROUNDS=10
EOF

echo -e "${GREEN}✅ Created .env.security file${NC}"
echo ""

echo "🔨 Step 3: Building common package..."
cd packages/common
npm run build
cd ../..

echo -e "${GREEN}✅ Common package built${NC}"
echo ""

echo "🧪 Step 4: Running security validation..."
echo ""

# Check if Redis is running
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  redis-cli not found. Please install Redis for rate limiting.${NC}"
else
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is not running. Start with: docker-compose up -d redis${NC}"
    fi
fi

echo ""

# Check security files
echo "📁 Checking security files..."
SECURITY_FILES=(
    "packages/common/src/middleware/rate-limit.middleware.ts"
    "packages/common/src/middleware/sanitize.middleware.ts"
    "packages/common/src/middleware/cors.middleware.ts"
    "packages/common/src/middleware/api-key.middleware.ts"
    "packages/common/src/utils/encryption.util.ts"
    "docs/SECURITY_SUMMARY.md"
    "docs/SECURITY_IMPLEMENTATION.md"
    "docs/SECURITY_QUICK_REFERENCE.md"
)

for file in "${SECURITY_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file - MISSING"
    fi
done

echo ""
echo "================================"
echo -e "${GREEN}🎉 Security Setup Complete!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Copy secrets from .env.security to your service .env files"
echo "2. Start Redis: docker-compose up -d redis"
echo "3. Apply security middleware to your services (see docs/SECURITY_IMPLEMENTATION.md)"
echo "4. Test security features with: npm run test:security"
echo ""
echo "Documentation:"
echo "- Quick Reference: docs/SECURITY_QUICK_REFERENCE.md"
echo "- Implementation Guide: docs/SECURITY_IMPLEMENTATION.md"
echo "- Security Summary: docs/SECURITY_SUMMARY.md"
echo ""
