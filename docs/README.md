# Shopping App Documentation

> **Production-ready B2B e-commerce platform built with microfrontend architecture, type-safe contracts, and event-driven communication.**

---

## 🎯 What is This Platform?

This is a modern B2B shopping platform demonstrating **industry best practices** for building scalable microfrontend applications:

- **6 Independent Microfrontends**: Shell, Search, Products, Cart, Wishlist, Reviews
- **Type-Safe Contracts**: Shared TypeScript definitions prevent integration bugs
- **Event-Driven Communication**: Loosely coupled MFEs communicate via typed events
- **Modern Stack**: Next.js 14+, React 18+, TypeScript 5+, Jest, Module Federation
- **Production Features**: Error boundaries, health checks, feature flags, monitoring, retry/caching

**Current Status**: ✅ Production Ready | 96 Tests Passing | 67% Coverage | 100% B2B Compliant

---

## 🚀 Quick Navigation

| If you want to... | Go here |
|-------------------|---------|
| **Get started in 5 minutes** | [Quick Start Guide](guides/QUICK_START.md) |
| **Understand the architecture** | [Microfrontend Architecture ADR](adr/001-microfrontend-architecture.md) |
| **Learn best practices** | [Best Practices Guide](architecture/BEST_PRACTICES.md) |
| **See test results** | [Test Implementation Summary](testing/TEST_IMPLEMENTATION_SUMMARY.md) |
| **Understand decisions** | [ADR Index](adr/README.md) |
| **Deploy to production** | [Deployment Guide](guides/DEPLOYMENT.md) |
| **Work with contracts** | [Using Contracts](examples/USING_CONTRACTS.md) |
| **Daily development** | [Development Guide](guides/DEVELOPMENT.md) |

---

## 📚 Documentation Structure

### 🚀 Getting Started (New Developers Start Here!)

1. **[Quick Start Guide](guides/QUICK_START.md)** - Run locally in 5 minutes
2. **[Architecture Overview](architecture/MICROFRONTEND_B2B_GUIDE.md)** - Understand the system
3. **[Best Practices](architecture/BEST_PRACTICES.md)** - How we build features
4. **[Development Guide](guides/DEVELOPMENT.md)** - Daily workflows

### 📖 Development Guides

Day-to-day development workflows:

- **[Development Guide](guides/DEVELOPMENT.md)** - Local setup, npm scripts, debugging, hot reload
- **[MFE Communication Guide](guides/MFE_COMMUNICATION.md)** - Event-driven patterns and examples
- **[Deployment Guide](guides/DEPLOYMENT.md)** - Deploy MFEs independently to production
- **[Using Contracts](examples/USING_CONTRACTS.md)** - Work with the shared contracts package

### 🏗️ Architecture Documentation

Deep architectural insights:

- **[Microfrontend B2B Guide](architecture/MICROFRONTEND_B2B_GUIDE.md)** - Complete system design overview
- **[Best Practices Guide](architecture/BEST_PRACTICES.md)** - Comprehensive implementation guide (20+ practices)
- **[B2B Compliance](architecture/B2B_COMPLIANCE.md)** - 100% B2B requirements verification
- **[ADR Index](adr/README.md)** - All Architecture Decision Records

### 📋 Architecture Decision Records (ADRs)

**Why did we make these decisions?** ADRs document the reasoning:

| ADR | Title | What It Explains |
|-----|-------|------------------|
| **[001](adr/001-microfrontend-architecture.md)** | Microfrontend Architecture | Why we split the monolith into 6 MFEs |
| **[002](adr/002-module-federation.md)** | Module Federation | How we load MFEs at runtime with Webpack |
| **[003](adr/003-shared-contracts-package.md)** | Shared Contracts | Type safety strategy across all MFEs |
| **[004](adr/004-event-driven-communication.md)** | Event-Driven Communication | How MFEs talk without coupling |
| **[005](adr/005-independent-deployments.md)** | Independent Deployments | Deploy one MFE without touching others |
| **[006](adr/006-shared-state-management.md)** | State Management | Local-first with shared auth pattern |
| **[007](adr/007-api-client-architecture.md)** | API Client | Retry, caching, rate limiting strategy |
| **[008](adr/008-accessibility-first.md)** | Accessibility | WCAG 2.1 AA compliance approach |
| **[009](adr/009-observability-platform.md)** | Observability | Logging, monitoring, tracing setup |
| **[010](adr/010-testing-strategy.md)** | Testing Strategy | Unit, integration, E2E test approach |

### 📦 Shared Packages

Packages used across all microfrontends:

#### **[@shopping-app/mfe-contracts](../packages/mfe-contracts/README.md)** - v1.2.0

**Type-safe contracts for cross-MFE communication**

Provides TypeScript definitions, event system, and shared utilities to ensure type safety across all microfrontends.

**What's Inside**:
- **Domain Models**: `Product`, `Cart`, `User`, `Order` (TypeScript interfaces)
- **Event Contracts**: All event names and payload types (e.g., `cart:add`, `wishlist:toggle`)
- **Event Bus**: Type-safe pub/sub system for MFE communication
- **Component Props**: Federated component interfaces
- **Configuration**: Shared config types and utilities
- **React Hooks**: `useMFEEvent`, `useMFEPublish`, `useAuth`, `useFeatureFlag`
- **Analytics**: Event tracking types
- **Health Checks**: MFE health monitoring utilities
- **Accessibility**: A11y helper types and validators

**Key Features**:
- ✅ Full TypeScript support (compile-time type checking)
- ✅ Event-driven communication primitives
- ✅ Runtime validation helpers (Zod schemas)
- ✅ Feature flags manager (gradual rollout support)
- ✅ Shared authentication manager (cross-MFE auth sync)
- ✅ Error boundaries (`MFEErrorBoundary` component)
- ✅ Performance monitoring hooks

**Usage Example**:
```typescript
import { useMFEEvent, useMFEPublish, Product } from '@shopping-app/mfe-contracts';

// Publish typed event
const publish = useMFEPublish();
publish('cart:add', { productId: '123', quantity: 1, timestamp: Date.now() });

// Subscribe to typed event
useMFEEvent('cart:add', (payload) => {
  // payload is typed as CartAddEvent ✅
  console.log(`Added product ${payload.productId}`);
});
```

#### **[@shopping-app/shared-ui](../packages/shared-ui/README.md)** - v1.1.0

**Shared UI utilities and components**

Provides reusable utilities, API client, and validation functions.

**What's Inside**:
- **API Client**: Fetch wrapper with retry, caching, rate limiting, timeout
- **Validation**: Email, password, credit card, phone, URL validators
- **Formatting**: Currency, dates, relative time formatters
- **Helpers**: Debounce, throttle, groupBy, unique, deepClone
- **Logger**: Structured logging with levels (info, warn, error, debug)
- **Environment Validator**: Validate required env vars on startup
- **Loading Skeletons**: Reusable skeleton components for loading states

**Key Features**:
- ✅ API client with exponential backoff retry
- ✅ Request deduplication and caching
- ✅ Rate limiting (max requests per second)
- ✅ Comprehensive validation utilities
- ✅ TypeScript types for all functions
- ✅ **96 tests, 67% coverage** (100% for components, 96% for validation)

**Usage Example**:
```typescript
import { apiClient, validateEmail } from '@shopping-app/shared-ui';

// API call with retry and caching
const products = await apiClient.get<Product[]>('/api/products', {
  retry: { attempts: 3, delay: 1000 },
  cache: { ttl: 60000 },
});

// Validation
if (!validateEmail(email)) {
  throw new Error('Invalid email');
}
```

### 🧪 Testing Documentation

**Current Test Status**: 96 tests passing, 67% overall coverage

- **[Test Implementation Summary](testing/TEST_IMPLEMENTATION_SUMMARY.md)** - Detailed test results, coverage breakdown, examples
- **[ADR-010: Testing Strategy](adr/010-testing-strategy.md)** - Overall testing philosophy and approach

**Test Coverage by Package**:
- ✅ **shared-ui**: 96/96 tests (100% pass), 67% coverage, 100% components, 96% validation
- ⏳ **mfe-contracts**: Test infrastructure ready, implementation in progress
- ⏳ **MFE Apps**: Per-MFE tests planned
- ⏳ **E2E Tests**: Planned (Playwright or Cypress)

### 💡 Examples & Usage Guides

- **[Using Contracts](examples/USING_CONTRACTS.md)** - Practical examples of using `@shopping-app/mfe-contracts`
- **[API Client Usage](#api-client-usage)** - Examples below

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                  Shell App (Host)                         │
│                     Port 3000                             │
│                   Platform Team                           │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐                │
│  │ Search  │  │ Wishlist │  │ Reviews │                │
│  │  3001   │  │   3002   │  │  3003   │                │
│  │ Search  │  │Engagement│  │Engagement│               │
│  │  Team   │  │   Team   │  │  Team   │                │
│  └─────────┘  └──────────┘  └─────────┘                │
│                                                           │
│  ┌─────────┐  ┌─────────┐                               │
│  │Products │  │  Cart   │                               │
│  │  3004   │  │  3005   │                               │
│  │Commerce │  │Commerce │                               │
│  │  Team   │  │  Team   │                               │
│  └─────────┘  └─────────┘                               │
│                                                           │
│         via @shopping-app/mfe-contracts                  │
│         via @shopping-app/shared-ui                      │
└──────────────────────────────────────────────────────────┘
                         ↕
                   Event Bus
                         ↕
┌──────────────────────────────────────────────────────────┐
│              Backend Microservices                        │
│                                                           │
│  API Gateway → Auth → Products → Orders → Cart           │
│            → Payment → Inventory → Notifications         │
│                                                           │
│           via @shopping-app/common                        │
└──────────────────────────────────────────────────────────┘
```

## 📖 Microfrontend Documentation

### 🏠 Shell App (Platform Team)
**Port:** 3000  
**Responsibilities:**
- Host container for all MFEs
- Layout and navigation
- Centralized authentication
- Routing orchestration

**Key Components:**
- Layout wrapper
- Navigation bar
- Auth provider

---

### 🔍 Search MFE (Search Team)
**Port:** 3001  
**Responsibilities:**
- Product search functionality
- Advanced filtering
- Sort options
- Search autocomplete

**Key Components:**
- `<SearchBar />` - Main search input
- `<FilterPanel />` - Advanced filters

---

### 🛍️ Products MFE (Commerce Team)
**Port:** 3004  
**Responsibilities:**
- Product catalog
- Product details
- Product recommendations

**Key Components:**
- `<ProductGrid />` - Product listing
- `<ProductCard />` - Individual product

---

### 🛒 Cart MFE (Commerce Team)
**Port:** 3005  
**Responsibilities:**
- Shopping cart management
- Checkout flow
- Cart persistence

**Key Components:**
- `<CartSummary />` - Cart display
- `<CheckoutFlow />` - Multi-step checkout

---

### ❤️ Wishlist MFE (Engagement Team)
**Port:** 3002  
**Responsibilities:**
- Wishlist management
- Save for later
- Wishlist sharing

**Key Components:**
- `<WishlistButton />` - Add to wishlist

---

### ⭐ Reviews MFE (Engagement Team)
**Port:** 3003  
**Responsibilities:**
- Product reviews
- Rating system
- Review moderation

**Key Components:**
- `<ProductReviews />` - Reviews display

---

## 🎯 Quick Reference

### Package Versions
- `@shopping-app/mfe-contracts` - **v1.1.0**
- `@shopping-app/shared-ui` - **v1.0.0**
- `@shopping-app/common` - **v1.0.0**

### Key Documentation
- ⭐ [B2B Compliance](architecture/B2B_COMPLIANCE.md) - **100% Compliant**
- ⭐ [Best Practices](architecture/BEST_PRACTICES.md) - **Complete Checklist**
- 📋 [Contracts Implementation](architecture/MFE_CONTRACTS_IMPLEMENTATION.md)
- 🚀 [Quick Start](guides/QUICK_START.md)

## 💻 API Client Usage

### Basic Usage

```typescript
import { createAPIClient } from '@shopping-app/shared-ui';

const api = createAPIClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 5000
});

// GET request
const products = await api.get<Product[]>('/products');

// POST request
const newOrder = await api.post<Order>('/orders', {
  items: cartItems,
  total: cartTotal
});

// With auth
import { tokenStorage, withAuth } from '@shopping-app/shared-ui';

const headers = withAuth({ 'Content-Type': 'application/json' });
const profile = await api.get<User>('/profile', { headers });
```

### Formatting & Validation

```typescript
import { 
  formatCurrency, 
  formatDate,
  validateEmail,
  debounce 
} from '@shopping-app/shared-ui';

// Formatting
formatCurrency(29.99, 'USD'); // "$29.99"
formatDate(new Date(), 'relative'); // "2 hours ago"

// Validation
const emailResult = validateEmail('user@example.com');
if (!emailResult.isValid) {
  console.error(emailResult.errors); // ["Invalid email format"]
}

// Debounce
const handleSearch = debounce((query: string) => {
  api.get(`/search?q=${query}`);
}, 300);
```

## 🔗 Links

- [Main README](../README.md)
- [B2B Compliance Report](architecture/B2B_COMPLIANCE.md)
- [Packages Directory](../packages/)
- [Apps Directory](../apps/)
