# Products MFE - Architecture Documentation

## Overview

The Products Microfrontend (MFE) is a standalone, independently deployable module responsible for product catalog management and display within the shopping application ecosystem.

**Version:** 1.0.0  
**Owner:** Commerce Team  
**Port:** 3004  
**Framework:** Next.js 14 (App Router)

## Architectural Principles

### 1. Independence
- **Standalone Deployment:** Can be deployed independently without affecting other MFEs
- **Self-contained:** All product-related logic and UI contained within this module
- **Technology Freedom:** Uses its own tech stack (Next.js 14, React Query v5)

### 2. Composability
- **Module Federation Ready:** Exposes components for consumption by other MFEs
- **Event-driven Communication:** Uses events for inter-MFE communication
- **Shared Contracts:** Type-safe contracts via `@shopping-app/mfe-contracts`

### 3. Scalability
- **Horizontal Scaling:** Can be scaled independently based on product traffic
- **Cache Strategy:** Multi-layer caching (TanStack Query 5min, CDN edge caching with s-maxage, Redis backend cache)
- **Performance Optimized:** Code splitting, lazy loading, optimized bundles, CDN distribution

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Products MFE (Port 3004)                │
│                                                             │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Next.js 14   │  │ React Query  │  │  TailwindCSS    │ │
│  │  (App Router) │  │     v5       │  │                 │ │
│  └───────────────┘  └──────────────┘  └─────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │              Component Layer                           ││
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │ProductGrid  │  │ ProductCard  │  │ErrorBoundary │ ││
│  │  └─────────────┘  └──────────────┘  └──────────────┘ ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │              Business Logic Layer                      ││
│  │  ┌──────────────────┐  ┌──────────────────┐          ││
│  │  │ Product Queries  │  │  API Client      │          ││
│  │  │ (React Query)    │  │                  │          ││
│  │  └──────────────────┘  └──────────────────┘          ││
│  └────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │              Data Layer                                ││
│  │  ┌──────────────────┐  ┌──────────────────┐          ││
│  │  │ Query Cache      │  │  Mock Data       │          ││
│  │  │ (5min stale)     │  │  (Dev/Test)      │          ││
│  │  └──────────────────┘  └──────────────────┘          ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
                ┌───────────────────────┐
                │   Product Service     │
                │   (Port 3001)         │
                │   ┌─────────────────┐ │
                │   │   REST API      │ │
                │   │   /api/products │ │
                │   └─────────────────┘ │
                └───────────────────────┘
                            │
                            ↓
                ┌───────────────────────┐
                │   PostgreSQL DB       │
                │   (products)          │
                └───────────────────────┘
```

## Technology Stack

### Frontend Framework
- **Next.js 14.2.x** - React framework with App Router
  - Server Components support
  - Automatic code splitting
  - Image optimization
  - Built-in routing

### State Management
- **TanStack Query v5** - Server state management
  - Automatic caching (5min stale, 10min garbage collection)
  - Background refetching
  - Optimistic updates
  - Query invalidation
  - DevTools in development

### UI & Styling
- **React 18.2** - UI library
- **TailwindCSS 3.4** - Utility-first CSS
- **Lucide React** - Icon library

### Type Safety
- **TypeScript 5.3** - Static typing
- **@shopping-app/mfe-contracts** - Shared type contracts

### Testing
- **Jest 30.2** - Test runner
- **React Testing Library 16.3** - Component testing
- **MSW 2.12** - API mocking

## Directory Structure

```
apps/mfe-products/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx           # Root layout with providers
│   │   └── page.tsx             # Products listing page
│   │
│   ├── components/              # React components
│   │   ├── error-boundary.tsx   # Error handling
│   │   ├── product-card.tsx     # Single product display
│   │   └── product-grid.tsx     # Products grid with loading states
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── use-product-queries.ts # React Query hooks
│   │
│   ├── lib/                     # Utilities and configs
│   │   ├── api.ts              # API client functions
│   │   ├── logger.ts           # Production-safe logger
│   │   ├── query-config.ts     # React Query configuration
│   │   └── query-provider.tsx  # Query provider wrapper
│   │
│   └── __tests__/              # Test files
│       ├── components/         # Component tests
│       ├── lib/               # API tests
│       ├── fixtures/          # Test data (mock products)
│       └── utils/             # Test utilities
│
├── config/                      # Configuration files
│   ├── jest.config.js          # Jest configuration
│   ├── jest.setup.ts           # Jest setup
│   ├── postcss.config.js       # PostCSS configuration
│   └── tailwind.config.ts      # Tailwind configuration
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── API.md                  # API documentation
│   ├── PERFORMANCE.md          # Performance guide
│   └── SECURITY.md             # Security documentation
│
├── public/                      # Static assets
├── next.config.js              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Component Architecture

### Component Hierarchy

```
App (layout.tsx)
├── ErrorBoundary
│   └── QueryProvider (React Query)
│       └── Page (page.tsx)
│           └── ProductGrid
│               ├── ProductCard (multiple)
│               └── Loading Skeleton (conditional)
```

### Component Responsibilities

#### 1. **ProductGrid**
- **Purpose:** Container for product display
- **Responsibilities:**
  - Grid layout management
  - Loading state handling
  - Empty state display
  - Product click handling
  - Add to cart event publishing
- **Props:** `products`, `loading`, `onProductClick`, `onAddToCart`, `limit`, `className`

#### 2. **ProductCard**
- **Purpose:** Individual product display
- **Responsibilities:**
  - Product information display
  - Image rendering
  - Rating display
  - Add to cart button
  - Accessibility (ARIA labels)
- **Props:** `product`, `onAddToCart`

#### 3. **ErrorBoundary**
- **Purpose:** Error isolation and recovery
- **Responsibilities:**
  - Catch React errors
  - Display fallback UI
  - Error logging (production)
  - Reload mechanism
- **Props:** `children`, `fallback`, `onError`

## Data Flow

### Query Flow (Read Operations)

```
User Action
    ↓
Component (useProducts hook)
    ↓
React Query (check cache)
    ↓
Cache Hit? → Return cached data
    ↓
Cache Miss? → Fetch from API
    ↓
API Client (api.ts)
    ↓
Product Service (HTTP)
    ↓
Response
    ↓
React Query (cache + return)
    ↓
Component (re-render)
```

### Mutation Flow (Write Operations)

```
User Action (e.g., Add to Cart)
    ↓
Event Handler
    ↓
MFE Event Publisher
    ↓
Event Bus
    ↓
Other MFEs (Cart MFE)
    ↓
Update Backend
    ↓
Invalidate Cache
    ↓
Re-fetch Data
```

## State Management Strategy

### Server State (React Query)
- **Products List:** Cached for 5 minutes
- **Product Details:** Cached for 5 minutes
- **Automatic Refetch:** On window focus, network reconnect
- **Stale Time:** 5 minutes (configurable)
- **Cache Time:** 10 minutes (garbage collection)

### Client State (React Hooks)
- **UI State:** useState for loading, error states
- **Form State:** Not applicable (read-only catalog)
- **Temporary State:** Component-local state

### Shared State (Events)
- **Product Viewed:** Published to analytics
- **Add to Cart:** Published to cart MFE
- **Search Query:** Consumed from search MFE
- **Filters Applied:** Consumed from filter MFE

## API Integration

### Endpoints Used

| Endpoint | Method | Purpose | Cache |
|----------|--------|---------|-------|
| `/api/products` | GET | List products | 5min |
| `/api/products/:id` | GET | Product details | 5min |

### Request Flow

1. **Request Initiation:** User action or component mount
2. **Cache Check:** React Query checks cache first
3. **Network Request:** If cache miss, fetch from API
4. **Response Handling:** Parse JSON, validate types
5. **Cache Update:** Store in React Query cache
6. **Component Update:** Trigger re-render with new data

### Error Handling

- **Network Errors:** Display retry UI, fallback to mock data (dev)
- **API Errors:** Show error message with retry button
- **Timeout:** 30-second timeout with retry
- **Rate Limiting:** Handled by React Query (max 2 retries)

## Module Federation

### Exposed Components

```javascript
// webpack config
exposes: {
  './ProductGrid': './src/components/product-grid',
  './ProductCard': './src/components/product-card'
}
```

### Shared Dependencies

```javascript
shared: {
  react: { singleton: true, requiredVersion: '^18.2.0' },
  'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
  '@tanstack/react-query': { singleton: true }
}
```

### Remote Entry

- **Production:** `https://cdn.example.com/mfe-products/remoteEntry.js`
- **Development:** `http://localhost:3004/remoteEntry.js`

## Event-Driven Communication

### Published Events

```typescript
// Product viewed
eventBus.publish('product:viewed', {
  productId: string,
  timestamp: Date,
  source: 'products-mfe'
});

// Product added to cart
eventBus.publish('cart:add', {
  productId: string,
  quantity: number,
  timestamp: Date
});
```

### Subscribed Events

```typescript
// Search query from Search MFE
eventBus.subscribe('search:query', (payload) => {
  // Filter products by search query
  setSearchQuery(payload.query);
});

// Filters from Filter MFE
eventBus.subscribe('filter:applied', (payload) => {
  // Apply category/price filters
  setFilters(payload);
});
```

## Deployment Architecture

### Build Process

```bash
1. Install dependencies: npm ci
2. Type check: npm run type-check
3. Lint: npm run lint
4. Test: npm run test:ci
5. Build: npm run build
6. Deploy: Upload to CDN/Server
```

### Environment Configuration

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_DEBUG=true

# Staging
NEXT_PUBLIC_API_URL=https://api-staging.example.com
NEXT_PUBLIC_USE_MOCK_DATA=false

# Production
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_USE_MOCK_DATA=false
```

### Deployment Targets

- **CDN:** Static assets (Cloudflare, Vercel)
- **Container:** Docker + Kubernetes
- **Serverless:** Vercel, AWS Lambda@Edge

## Monitoring & Observability

### Metrics Tracked

- **Performance:** LCP, FCP, TTI, CLS
- **API Calls:** Success rate, latency, errors
- **User Actions:** Product views, add to cart clicks
- **Cache Hit Rate:** React Query cache efficiency

### Logging Strategy

- **Development:** Console logging enabled
- **Production:** Silent + error monitoring service
- **Log Levels:** info, warn, error, debug

### Error Tracking

- **Client Errors:** Error Boundary catches
- **API Errors:** Logged with request/response context
- **Analytics:** Product interaction tracking

## Performance Considerations

### Bundle Size
- **Main Route:** 8.89 kB
- **First Load JS:** 104 kB
- **Shared JS:** 87.4 kB

### Optimization Strategies
1. **Code Splitting:** Automatic route-based splitting
2. **Image Optimization:** Next.js Image component (TODO)
3. **Caching:** Multi-layer (React Query, HTTP, CDN)
4. **Lazy Loading:** Below-the-fold content
5. **Prefetching:** Hover-based prefetch (TODO)

## Scalability

### Horizontal Scaling
- **Stateless:** No server-side session state
- **Load Balancer Ready:** Multiple instances behind LB
- **CDN Distribution:** Static assets on edge nodes

### Vertical Scaling
- **Memory:** ~512MB per instance
- **CPU:** Minimal (mostly serving static files)
- **Network:** High bandwidth for images

## Dependencies Management

### Critical Dependencies
- **react, react-dom:** UI framework
- **next:** Framework & bundler
- **@tanstack/react-query:** State management

### Upgrade Strategy
1. Monitor security advisories
2. Test in staging environment
3. Gradual rollout in production
4. Rollback plan ready

## Future Enhancements

### Short Term
- [ ] Implement next/image for optimization
- [ ] Add virtual scrolling for large lists
- [ ] Implement prefetching on hover
- [ ] Add service worker for offline support

### Long Term
- [ ] Convert to Server Components
- [ ] Implement ISR for product pages
- [ ] Add GraphQL layer
- [ ] WebSocket for real-time updates

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
- [Micro-Frontend Architecture](https://micro-frontends.org/)
