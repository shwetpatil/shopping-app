# Package Overview

This directory contains shared packages used across the Shopping App microfrontend platform.

## 📦 Packages

### [@shopping-app/mfe-contracts](mfe-contracts/) - v1.1.0
> Type-safe contracts and advanced features for frontend microfrontends

**Purpose:** Provides shared TypeScript contracts, interfaces, and utilities for MFE communication and features.

**Key Features:**
- ✅ Type definitions for domain models (Product, User, Order, Cart, Wishlist, Review)
- ✅ Event system with EventBus for MFE-to-MFE communication
- ✅ Component prop interfaces (ProductCard, SearchBar, CartSummary, etc.)
- ✅ Performance monitoring hooks (useMFELoadTime, useMFEInteraction, useMFEApiTracking)
- ✅ Feature flags manager with gradual rollout and user targeting
- ✅ Centralized configuration for all MFEs
- ✅ Shared auth manager with useAuth hook and withAuth HOC
- ✅ Error boundaries (MFEErrorBoundary) for fault isolation

**Used By:** All 6 microfrontends (shell, search, products, cart, wishlist, reviews)

**Installation:**
```bash
npm install ../../packages/mfe-contracts
```

**Documentation:**
- [CHANGELOG](mfe-contracts/CHANGELOG.md)
- [Implementation Guide](../docs/architecture/MFE_CONTRACTS_IMPLEMENTATION.md)
- [Usage Examples](../docs/examples/USING_CONTRACTS.md)

---

### [@shopping-app/shared-ui](shared-ui/) - v1.0.0
> Shared UI utilities, API client, and validation for frontend microfrontends

**Purpose:** Provides common utilities, API client, and validation functions to eliminate code duplication across MFEs.

**Key Features:**
- ✅ Fetch-based API client with auth support
- ✅ Token storage utilities (access/refresh tokens)
- ✅ Formatting helpers (currency, dates, relative time)
- ✅ Validation utilities (email, password, credit card, phone, URL)
- ✅ Helper functions (debounce, throttle, groupBy, unique, deepClone)
- ✅ Full TypeScript support with proper types

**Used By:** All 6 microfrontends (shell, search, products, cart, wishlist, reviews)

**Installation:**
```bash
npm install ../../packages/shared-ui
```

**Documentation:**
- [README](shared-ui/README.md)
- [CHANGELOG](shared-ui/CHANGELOG.md)

**Usage Example:**
```typescript
import { 
  createAPIClient,
  formatCurrency,
  validateEmail,
  debounce 
} from '@shopping-app/shared-ui';

// API client
const api = createAPIClient({ baseURL: 'http://localhost:8080' });
const products = await api.get<Product[]>('/products');

// Formatting
formatCurrency(29.99, 'USD'); // "$29.99"

// Validation
const result = validateEmail('user@example.com');
if (!result.isValid) {
  console.error(result.errors);
}

// Debounce
const handleSearch = debounce((query: string) => {
  // API call
}, 300);
```

---

### [@shopping-app/common](common/) - v1.0.0
> Backend utilities for microservices

**Purpose:** Provides shared utilities for backend Node.js microservices.

**Key Features:**
- ✅ Error handling (custom error classes)
- ✅ Event bus (Kafka integration)
- ✅ Logging (Winston with structured logging)
- ✅ Express middleware (auth, error handling, rate limiting)
- ✅ Validators (request validation)
- ✅ Types (shared backend types)

**Used By:** All 8 backend microservices

**Installation:**
```bash
npm install ../../packages/common
```

**Usage Example:**
```typescript
import { logger, createEventBus, ValidationError } from '@shopping-app/common';

// Logging
logger.info('Order created', { orderId: '123' });

// Events
const eventBus = createEventBus();
await eventBus.publish('order.created', { orderId: '123' });

// Errors
throw new ValidationError('Invalid email format');
```

---

## 🏗️ Package Architecture

### Frontend Packages
```
mfe-contracts/          # Contracts & advanced features
├── types/              # Domain models
├── events/             # Event system
├── components/         # Component props
├── performance/        # Monitoring hooks
├── features/           # Feature flags
├── config/             # Configuration
└── auth/               # Auth manager

shared-ui/              # UI utilities
├── api/                # API client
└── utils/              # Helpers & validation
```

### Backend Packages
```
common/                 # Backend utilities
├── errors/             # Error handling
├── events/             # Event bus
├── logger/             # Logging
├── middleware/         # Express middleware
├── types/              # Shared types
└── validators/         # Validation
```

---

## 📊 Dependency Matrix

| Package | Used By | Dependencies |
|---------|---------|--------------|
| **mfe-contracts** | 6 MFEs | React (peer) |
| **shared-ui** | 6 MFEs | React (peer), clsx |
| **common** | 8 Services | Express, Kafka, Redis, Winston |

---

## 🔄 Version Management

All packages follow [Semantic Versioning](https://semver.org/):
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Current Versions
- `mfe-contracts`: **v1.1.0**
- `shared-ui`: **v1.0.0**
- `common`: **v1.0.0**

---

## 🚀 Development

### Building Packages

```bash
# Build all packages
cd packages/mfe-contracts && npm run build
cd packages/shared-ui && npm run build
cd packages/common && npm run build

# Watch mode (development)
cd packages/mfe-contracts && npm run dev
```

### Adding New Shared Code

**Frontend utilities → `shared-ui`**
- API client logic
- Formatting functions
- Validation utilities
- Helper functions

**Frontend contracts → `mfe-contracts`**
- Type definitions
- Event contracts
- Component interfaces
- Advanced features (auth, feature flags, etc.)

**Backend utilities → `common`**
- Error handling
- Logging
- Middleware
- Event bus integration

---

## 📖 Documentation

- [B2B Compliance](../docs/architecture/B2B_COMPLIANCE.md) - Package compliance verification
- [Best Practices](../docs/architecture/BEST_PRACTICES.md) - Shared code patterns
- [MFE Contracts Guide](../docs/architecture/MFE_CONTRACTS_IMPLEMENTATION.md)
- [Using Contracts](../docs/examples/USING_CONTRACTS.md)

---

## ✅ Quality Standards

All packages must:
- ✅ Use TypeScript with strict mode
- ✅ Include proper type definitions
- ✅ Have comprehensive README
- ✅ Maintain CHANGELOG
- ✅ Follow semantic versioning
- ✅ Build without errors
- ✅ Have minimal dependencies
- ✅ Use peer dependencies for framework libs
- ✅ Be framework agnostic (where possible)
- ✅ Include usage examples
