#!/usr/bin/env node
/**
 * Generate .env.example files from centralized config
 * This ensures documentation matches actual ports
 */

const fs = require('fs');
const path = require('path');

// Load centralized ports
const { SERVICE_PORTS, MFE_PORTS, INFRA_PORTS } = (() => {
  try {
    return require('../config/ports');
  } catch {
    require('tsx/cjs');
    return require('../config/ports.ts');
  }
})();

const mfeExamples = {
  'mfe-shell': `# API Configuration
# All ports are centrally managed in config/ports.ts
# API Gateway: ${SERVICE_PORTS.API_GATEWAY}, Shell MFE: ${MFE_PORTS.SHELL}
# NEXT_PUBLIC_API_URL=http://localhost:${SERVICE_PORTS.API_GATEWAY}

# Feature Flags
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_USE_MOCK_DATA=false
`,

  'mfe-products': `# API Configuration
# All ports are centrally managed in config/ports.ts
# Product Service: ${SERVICE_PORTS.PRODUCT}, Products MFE: ${MFE_PORTS.PRODUCTS}
# NEXT_PUBLIC_API_URL=http://localhost:${SERVICE_PORTS.PRODUCT}

# Feature Flags
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_CACHE=true
NEXT_PUBLIC_USE_MOCK_DATA=false

# Cache TTL (milliseconds)
NEXT_PUBLIC_CACHE_TTL=300000
`,

  'mfe-search': `# API Configuration
# All ports are centrally managed in config/ports.ts
# Product Service: ${SERVICE_PORTS.PRODUCT}, Search MFE: ${MFE_PORTS.SEARCH}
# NEXT_PUBLIC_API_URL=http://localhost:${SERVICE_PORTS.PRODUCT}

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
`,

  'mfe-cart': `# API Configuration
# All ports are centrally managed in config/ports.ts  
# Cart Service: ${SERVICE_PORTS.CART}, Cart MFE: ${MFE_PORTS.CART}
# NEXT_PUBLIC_API_URL=http://localhost:${SERVICE_PORTS.CART}

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
`,

  'mfe-wishlist': `# API Configuration
# All ports are centrally managed in config/ports.ts
# API Gateway: ${SERVICE_PORTS.API_GATEWAY}, Wishlist MFE: ${MFE_PORTS.WISHLIST}
# NEXT_PUBLIC_API_URL=http://localhost:${SERVICE_PORTS.API_GATEWAY}

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
`,

  'mfe-reviews': `# API Configuration
# All ports are centrally managed in config/ports.ts
# API Gateway: ${SERVICE_PORTS.API_GATEWAY}, Reviews MFE: ${MFE_PORTS.REVIEWS}
# NEXT_PUBLIC_API_URL=http://localhost:${SERVICE_PORTS.API_GATEWAY}

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=false
`,
};

const serviceExamples = {
  'api-gateway': `# API Gateway Configuration
# Port: ${SERVICE_PORTS.API_GATEWAY} (from config/ports.ts)
PORT=${SERVICE_PORTS.API_GATEWAY}
NODE_ENV=development

# Service URLs - All from config/ports.ts
AUTH_SERVICE_URL=http://localhost:${SERVICE_PORTS.AUTH}
PRODUCT_SERVICE_URL=http://localhost:${SERVICE_PORTS.PRODUCT}
ORDER_SERVICE_URL=http://localhost:${SERVICE_PORTS.ORDER}
CART_SERVICE_URL=http://localhost:${SERVICE_PORTS.CART}
PAYMENT_SERVICE_URL=http://localhost:${SERVICE_PORTS.PAYMENT}
INVENTORY_SERVICE_URL=http://localhost:${SERVICE_PORTS.INVENTORY}
NOTIFICATION_SERVICE_URL=http://localhost:${SERVICE_PORTS.NOTIFICATION}

# CORS
CORS_ORIGIN=http://localhost:${MFE_PORTS.SHELL},http://localhost:${MFE_PORTS.PRODUCTS}

# Redis
REDIS_URL=redis://localhost:${INFRA_PORTS.REDIS}

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h
`,

  'product-service': `# Product Service Configuration
# Port: ${SERVICE_PORTS.PRODUCT} (from config/ports.ts)
PORT=${SERVICE_PORTS.PRODUCT}
NODE_ENV=development

# Database - Port from config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.PRODUCT_DB}/product_db?schema=public

# Redis
REDIS_URL=redis://localhost:${INFRA_PORTS.REDIS}

# CORS
CORS_ORIGIN=*
`,

  'auth-service': `# Auth Service Configuration
# Port: ${SERVICE_PORTS.AUTH} (from config/ports.ts)
PORT=${SERVICE_PORTS.AUTH}
NODE_ENV=development

# Database - Port from config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.AUTH_DB}/auth_db?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=*
`,
};

// Generate MFE .env.example files
Object.entries(mfeExamples).forEach(([mfeName, content]) => {
  const examplePath = path.join(__dirname, '..', 'apps', mfeName, '.env.example');
  fs.writeFileSync(examplePath, content);
  console.log(`✅ Generated: apps/${mfeName}/.env.example`);
});

// Generate service .env.example files
Object.entries(serviceExamples).forEach(([serviceName, content]) => {
  const examplePath = path.join(__dirname, '..', 'services', serviceName, '.env.example');
  fs.writeFileSync(examplePath, content);
  console.log(`✅ Generated: services/${serviceName}/.env.example`);
});

console.log('\n🎉 All .env.example files generated from config/ports.ts');
console.log('💡 All ports referenced from centralized config!');
