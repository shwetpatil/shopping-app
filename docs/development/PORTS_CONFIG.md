# Centralized Port Configuration

All ports are now managed from a single source: **`config/ports.ts`**

## How It Works

### 1. Single Source of Truth
All port definitions are in [`config/ports.ts`](../config/ports.ts):
- **MFE_PORTS**: Frontend microfrontends (3000-3005)
- **SERVICE_PORTS**: Backend microservices (4000-4008)  
- **INFRA_PORTS**: Infrastructure services (5433, 6379, etc.)

### 2. Auto-Generated Shell Configuration
The script [`scripts/load-ports.js`](load-ports.js) converts TypeScript config to shell variables:

```bash
node scripts/load-ports.js > scripts/ports.env
```

This generates [`scripts/ports.env`](ports.env) with:
```bash
export SERVICE_API_GATEWAY_PORT=4000
export SERVICE_PRODUCT_PORT=4002
export MFE_PRODUCTS_PORT=3004
# ... etc
```

### 3. Scripts Source the Configuration
All shell scripts now source `scripts/ports.env`:

```bash
#!/bin/bash
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SOURCE_DIR}/ports.env"

# Use variables instead of hardcoded ports
curl http://localhost:${SERVICE_API_GATEWAY_PORT}/health
```

## Updated Scripts

### Shell Scripts (`.sh`)
✅ **start-products-dev.sh** - Uses `$SERVICE_PRODUCT_PORT`, `$SERVICE_API_GATEWAY_PORT`, `$MFE_PRODUCTS_PORT`
✅ **test-phase2-apis.sh** - Uses `$SERVICE_API_GATEWAY_PORT`
🔄 **start-phase2-services.sh** - Needs update (has TypeScript errors)
🔄 **start-all-services.sh** - Needs update

### Node.js Scripts (`.js`)
✅ **start-mfe.js** - Already imports from `config/ports.ts`
✅ **load-ports.js** - Generator script

### TypeScript/JavaScript Code
✅ **MFE API clients** - Already use `SERVICE_PORTS` from config
✅ **Service `.env` files** - Use correct ports from config

## Making Changes

### To Change a Port:

1. **Edit ONE file**: `config/ports.ts`
   ```typescript
   export const SERVICE_PORTS = {
     API_GATEWAY: 4000,  // Change this
     PRODUCT: 4002,      // Or this
     // ...
   }
   ```

2. **Regenerate shell config**:
   ```bash
   node scripts/load-ports.js > scripts/ports.env
   ```

3. **All scripts automatically use the new ports!** 🎉

### To Add a New Service:

1. Add to `config/ports.ts`:
   ```typescript
   export const SERVICE_PORTS = {
     // ... existing
     NEW_SERVICE: 4009,
   }
   ```

2. Regenerate:
   ```bash
   node scripts/load-ports.js > scripts/ports.env
   ```

3. Use in shell scripts:
   ```bash
   source scripts/ports.env
   echo $SERVICE_NEW_SERVICE_PORT  # 4009
   ```

4. Use in TypeScript/JS:
   ```typescript
   import { SERVICE_PORTS } from '@shopping-app/config';
   const url = `http://localhost:${SERVICE_PORTS.NEW_SERVICE}`;
   ```

## Benefits

✅ **Single source of truth** - Change once, update everywhere
✅ **Type-safe** - TypeScript validates port numbers
✅ **No hardcoded values** - Easy to maintain
✅ **Environment-agnostic** - Easy to override for different environments
✅ **Automated** - Shell scripts stay in sync automatically

## Port Reference

### Frontend (3000-3005)
- **3000**: Shell App
- **3001**: Search MFE  
- **3002**: Wishlist MFE
- **3003**: Reviews MFE
- **3004**: Products MFE
- **3005**: Cart MFE

### Backend (4000-4008)
- **4000**: API Gateway
- **4001**: Auth Service
- **4002**: Product Service
- **4003**: Order Service
- **4005**: Payment Service
- **4006**: Cart Service
- **4007**: Inventory Service
- **4008**: Notification Service

### Infrastructure (5433+)
- **5433**: Product DB (PostgreSQL)
- **5434**: Order DB (PostgreSQL)
- **5435**: Auth DB (PostgreSQL)
- **5436**: Payment DB (PostgreSQL)
- **5437**: Inventory DB (PostgreSQL)
- **5438**: Notification DB (PostgreSQL)
- **6379**: Redis
- **8080**: Kafka UI
- **9092**: Kafka Internal
- **9093**: Kafka External

## Troubleshooting

### Shell scripts show undefined variables
**Solution**: Regenerate the config
```bash
node scripts/load-ports.js > scripts/ports.env
```

### Script can't find ports.env
**Solution**: Check the SOURCE_DIR path is correct
```bash
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# For scripts in /scripts: source "${SOURCE_DIR}/ports.env"
# For scripts in root: source "${SOURCE_DIR}/scripts/ports.env"
```

### Port conflict errors
**Solution**: Check what's using the port
```bash
lsof -i :4000  # Shows process using port 4000
```

## Migration Checklist

- [x] Created `scripts/load-ports.js` generator
- [x] Generated `scripts/ports.env` 
- [x] Updated `start-products-dev.sh`
- [x] Updated `test-phase2-apis.sh`
- [ ] Update `start-phase2-services.sh`
- [ ] Update `start-all-services.sh`
- [ ] Update `setup.sh`
- [ ] Update `setup-security.sh`
