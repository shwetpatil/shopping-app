# Port Configuration

This directory contains centralized configuration for all application and infrastructure ports.

## Usage

Import ports from the central configuration:

```typescript
// TypeScript/JavaScript
import { MFE_PORTS, SERVICE_PORTS, SERVICE_URLS } from './config/ports';

// Use in your code
const productServiceUrl = SERVICE_URLS.PRODUCT; // http://localhost:3002
const productsPort = MFE_PORTS.PRODUCTS; // 3004
```

## Port Allocations

### Frontend Microfrontends (3000-3005)

| Application | Port | Constant |
|------------|------|----------|
| Shell (Host) | 3000 | `MFE_PORTS.SHELL` |
| Search | 3001 | `MFE_PORTS.SEARCH` |
| Wishlist | 3002 | `MFE_PORTS.WISHLIST` |
| Reviews | 3003 | `MFE_PORTS.REVIEWS` |
| Products | 3004 | `MFE_PORTS.PRODUCTS` |
| Cart | 3005 | `MFE_PORTS.CART` |

### Backend Microservices (3000-3008)

| Service | Port | Constant |
|---------|------|----------|
| API Gateway | 3000 | `SERVICE_PORTS.API_GATEWAY` |
| Auth | 3001 | `SERVICE_PORTS.AUTH` |
| Product | 3002 | `SERVICE_PORTS.PRODUCT` |
| Order | 3003 | `SERVICE_PORTS.ORDER` |
| Payment | 3005 | `SERVICE_PORTS.PAYMENT` |
| Cart | 3006 | `SERVICE_PORTS.CART` |
| Inventory | 3007 | `SERVICE_PORTS.INVENTORY` |
| Notification | 3008 | `SERVICE_PORTS.NOTIFICATION` |

### Infrastructure Services

#### PostgreSQL Databases
| Database | Port | Constant |
|----------|------|----------|
| Auth DB | 5435 | `INFRA_PORTS.AUTH_DB` |
| Product DB | 5433 | `INFRA_PORTS.PRODUCT_DB` |
| Order DB | 5434 | `INFRA_PORTS.ORDER_DB` |
| Payment DB | 5436 | `INFRA_PORTS.PAYMENT_DB` |
| Inventory DB | 5437 | `INFRA_PORTS.INVENTORY_DB` |
| Notification DB | 5438 | `INFRA_PORTS.NOTIFICATION_DB` |

#### Other Infrastructure
| Service | Port | Constant |
|---------|------|----------|
| Redis | 6379 | `INFRA_PORTS.REDIS` |
| Kafka (Internal) | 9092 | `INFRA_PORTS.KAFKA_INTERNAL` |
| Kafka (External) | 9093 | `INFRA_PORTS.KAFKA_EXTERNAL` |
| Zookeeper | 2181 | `INFRA_PORTS.ZOOKEEPER` |
| Kafka UI | 8080 | `INFRA_PORTS.KAFKA_UI` |

## Helper Functions

### getServiceUrl(port, host?)
Generate service URL from port and optional host.

```typescript
import { getServiceUrl, SERVICE_PORTS } from './config/ports';

const url = getServiceUrl(SERVICE_PORTS.PRODUCT); 
// Returns: http://localhost:3002
```

### getDatabaseUrl(port, database, user?, password?, host?)
Generate PostgreSQL connection string.

```typescript
import { getDatabaseUrl, INFRA_PORTS } from './config/ports';

const dbUrl = getDatabaseUrl(INFRA_PORTS.AUTH_DB, 'auth_db');
// Returns: postgresql://postgres:postgres@localhost:5435/auth_db?schema=public
```

## Changing Ports

To change any port:

1. Update `config/ports.ts`
2. Update corresponding `.env.example` files
3. Restart affected services

The change will propagate automatically throughout the application.

## Best Practices

✅ **Always use constants from `config/ports.ts`**  
❌ **Never hardcode port numbers**

```typescript
// ✅ Good
import { SERVICE_URLS } from './config/ports';
const apiUrl = SERVICE_URLS.PRODUCT;

// ❌ Bad
const apiUrl = 'http://localhost:3002';
```

## Port Conflicts

If you encounter port conflicts:

1. Check what's using the port: `lsof -i :PORT_NUMBER`
2. Kill the process: `kill -9 $(lsof -ti:PORT_NUMBER)`
3. Or change the port in `config/ports.ts`
