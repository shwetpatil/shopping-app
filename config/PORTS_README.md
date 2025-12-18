# Port Configuration Guide

## ⚠️ Important: Centralized Port Management

**All ports are managed in `config/ports.ts`**

Do NOT hardcode ports in:
- ❌ package.json scripts
- ❌ .env files
- ❌ Application code
- ❌ Documentation

## How Ports Are Managed

### 1. Single Source of Truth
```typescript
// config/ports.ts
export const SERVICE_PORTS = {
  API_GATEWAY: 4000,
  PRODUCT: 4002,
  // ...
};
```

### 2. Generated Files
Run to update all configurations:
```bash
npm run config:generate-env
```

This generates:
- ✅ All service .env files
- ✅ Correct port assignments
- ✅ Service URL references

### 3. Application Code
```typescript
// Import ports in any file
import { SERVICE_PORTS } from '@shopping-app/config';
const PORT = process.env.PORT || SERVICE_PORTS.PRODUCT;
```

### 4. Package.json Scripts
MFEs use helper script:
```json
{
  "dev": "node ../../scripts/start-mfe.js mfe-products dev"
}
```

## Quick Reference

**Frontend (MFEs)**: 3000-3005
- Shell: 3000
- Search: 3001  
- Wishlist: 3002
- Reviews: 3003
- Products: 3004
- Cart: 3005

**Backend Services**: 4000-4008
- API Gateway: 4000
- Auth: 4001
- Product: 4002 ← **Use this for products API**
- Order: 4003
- Payment: 4005
- Cart: 4006
- Inventory: 4007
- Notification: 4008

**Infrastructure**: 
- PostgreSQL DBs: 5433-5438
- Redis: 6379
- Kafka: 9092-9093

## Changing a Port

1. Edit `config/ports.ts`
2. Run `npm run config:generate-env`
3. Restart services

That's it! No need to edit multiple files.
