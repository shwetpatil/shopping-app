#!/usr/bin/env node
/**
 * Generate .env files from centralized port configuration
 * This ensures all services use the same port definitions
 */

const fs = require('fs');
const path = require('path');

// Use tsx to load TypeScript config
const { SERVICE_PORTS, MFE_PORTS, INFRA_PORTS } = (() => {
  try {
    // Try loading compiled version first
    return require('../config/ports');
  } catch {
    // Fall back to loading TS file
    require('tsx/cjs');
    return require('../config/ports.ts');
  }
})();

// Service .env templates
const serviceEnvTemplates = {
  'api-gateway': `# API Gateway Configuration
PORT=${SERVICE_PORTS.API_GATEWAY}
NODE_ENV=development

# Service URLs - Managed by config/ports.ts
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
PORT=${SERVICE_PORTS.PRODUCT}
NODE_ENV=development

# Database - Managed by config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.PRODUCT_DB}/product_db?schema=public

# Redis
REDIS_URL=redis://localhost:${INFRA_PORTS.REDIS}

# CORS
CORS_ORIGIN=*
`,

  'auth-service': `# Auth Service Configuration
PORT=${SERVICE_PORTS.AUTH}
NODE_ENV=development

# Database - Managed by config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.AUTH_DB}/auth_db?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# CORS
CORS_ORIGIN=*
`,

  'order-service': `# Order Service Configuration
PORT=${SERVICE_PORTS.ORDER}
NODE_ENV=development

# Database - Managed by config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.ORDER_DB}/order_db?schema=public

# Service URLs
PRODUCT_SERVICE_URL=http://localhost:${SERVICE_PORTS.PRODUCT}
AUTH_SERVICE_URL=http://localhost:${SERVICE_PORTS.AUTH}

# Kafka - Managed by config/ports.ts
KAFKA_BROKERS=localhost:${INFRA_PORTS.KAFKA_BROKER1}

# CORS
CORS_ORIGIN=*
`,

  'cart-service': `# Cart Service Configuration
PORT=${SERVICE_PORTS.CART}
NODE_ENV=development

# Redis - Managed by config/ports.ts
REDIS_URL=redis://localhost:${INFRA_PORTS.REDIS}

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Service URLs
PRODUCT_SERVICE_URL=http://localhost:${SERVICE_PORTS.PRODUCT}

# CORS
CORS_ORIGIN=*
`,

  'payment-service': `# Payment Service Configuration
PORT=${SERVICE_PORTS.PAYMENT}
NODE_ENV=development

# Database - Managed by config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.PAYMENT_DB}/payment_db?schema=public

# Payment Provider
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Kafka - Managed by config/ports.ts
KAFKA_BROKERS=localhost:${INFRA_PORTS.KAFKA_BROKER1}

# Service URLs
ORDER_SERVICE_URL=http://localhost:${SERVICE_PORTS.ORDER}

# CORS
CORS_ORIGIN=*
`,

  'inventory-service': `# Inventory Service Configuration
PORT=${SERVICE_PORTS.INVENTORY}
NODE_ENV=development

# Database - Managed by config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.INVENTORY_DB}/inventory_db?schema=public

# Kafka - Managed by config/ports.ts
KAFKA_BROKERS=localhost:${INFRA_PORTS.KAFKA_BROKER1}

# CORS
CORS_ORIGIN=*
`,

  'notification-service': `# Notification Service Configuration
PORT=${SERVICE_PORTS.NOTIFICATION}
NODE_ENV=development

# Database - Managed by config/ports.ts
DATABASE_URL=postgresql://postgres:postgres@localhost:${INFRA_PORTS.NOTIFICATION_DB}/notification_db?schema=public

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@shopping-app.com

# CORS
CORS_ORIGIN=*
`,
};

// Generate .env files
Object.entries(serviceEnvTemplates).forEach(([serviceName, envContent]) => {
  const envPath = path.join(__dirname, '..', 'services', serviceName, '.env');
  
  // Backup existing .env
  if (fs.existsSync(envPath)) {
    fs.copyFileSync(envPath, `${envPath}.backup`);
    console.log(`✅ Backed up: ${serviceName}/.env → .env.backup`);
  }
  
  // Write new .env
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Generated: ${serviceName}/.env`);
});

console.log('\n🎉 All .env files generated from config/ports.ts');
console.log('💡 Tip: All ports are centrally managed in config/ports.ts');
