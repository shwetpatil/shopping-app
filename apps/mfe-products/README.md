# Products Microfrontend (MFE)

> 🛍️ **Independently deployable products catalog module**

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![React Query](https://img.shields.io/badge/React%20Query-v5-red)]()

## 📋 Overview

The Products MFE is responsible for displaying and managing the product catalog. Built with Next.js 14 and TanStack Query for optimal performance and user experience.

### Team Ownership

- **Team:** Commerce Team
- **Tech Lead:** [Your Name]
- **Slack:** #team-commerce

### Responsibilities

✅ Product catalog display  
✅ Product search and filtering  
✅ Product details pages  
✅ Inventory status display  
✅ Product events (viewed, added to cart)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development (Port 3004)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Architecture

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3
- **State Management:** TanStack Query v5
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library
- **API:** RESTful (Product Service - Port 3001)

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Products listing page
├── components/            # React components
│   ├── error-boundary.tsx # Error handling
│   ├── product-card.tsx   # Single product display
│   └── product-grid.tsx   # Products grid
├── hooks/                 # Custom React hooks
│   └── use-product-queries.ts  # React Query hooks
├── lib/                   # Utilities and configs
│   ├── api.ts            # API client
│   ├── logger.ts         # Centralized logger
│   ├── query-config.ts   # React Query config
│   └── query-provider.tsx # Query provider wrapper
└── __tests__/            # Test files
    ├── components/       # Component tests
    ├── lib/             # API tests
    ├── fixtures/        # Test data
    └── utils/           # Test utilities

config/                    # Configuration files
├── jest.config.ts        # Jest configuration
├── jest.setup.ts         # Jest setup
├── postcss.config.js     # PostCSS config
└── tailwind.config.ts    # Tailwind config
```

## 🎯 Features

### State Management

- **TanStack Query v5** for server state
- Automatic caching (5min stale, 10min cache)
- Automatic retries (2 attempts)
- Optimistic updates
- DevTools in development

### Error Handling

- Error boundaries for component errors
- Graceful degradation
- User-friendly error messages
- Fallback to mock data in development

### Testing

- **25 passing tests** across 4 test suites
- Component tests (ProductCard, ProductGrid)
- API integration tests
- Custom hook tests
- 100% critical path coverage

### Performance

- Code splitting
- Image optimization
- Automatic prefetching
- Minimal bundle size

## 🔌 Exposed Components

### ProductGrid

Grid display of products with loading states and error handling.

```tsx
import { ProductGrid } from '@shopping-app/mfe-products/ProductGrid';

<ProductGrid 
  products={products}
  loading={isLoading}
  onProductClick={(product) => navigate(`/product/${product.id}`)}
  onAddToCart={(event, productId) => addToCart(productId)}
/>
```

**Props:**
- `products: Product[]` - Array of products to display
- `loading?: boolean` - Show loading skeleton
- `onProductClick?: (product: Product) => void` - Product click handler
- `onAddToCart?: (event: MouseEvent, productId: string) => void` - Add to cart handler
- `limit?: number` - Limit number of displayed products
- `className?: string` - Additional CSS classes

### ProductCard

Single product card with image, details, and actions.

```tsx
import { ProductCard } from '@shopping-app/mfe-products/ProductCard';

<ProductCard 
  product={product}
  onAddToCart={(event, id) => addToCart(id)}
/>
```

**Props:**
- `product: Product` - Product data
- `onAddToCart?: (event: MouseEvent, productId: string) => void` - Add to cart handler

## 📡 Communication

### Events Published

| Event | Payload | Description |
|-------|---------|-------------|
| `product:viewed` | `{ productId: string }` | User viewed product details |
| `product:added_to_cart` | `{ productId: string, quantity: number }` | Product added to cart |

### Events Consumed

| Event | Payload | Action |
|-------|---------|--------|
| `search:query` | `{ query: string }` | Filter products by search |
| `filter:applied` | `{ category: string, ... }` | Apply filters to catalog |

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Development Mode
NEXT_PUBLIC_USE_MOCK_DATA=false  # Use mock data instead of API
NEXT_PUBLIC_DEBUG=false          # Enable debug logging

# Port (configured in config/ports.ts)
PORT=3004
```

### Port Configuration

All ports are centralized in `/config/ports.ts`:
- **MFE Port:** 3004
- **Product Service:** 3001

## 📚 API Reference

### Endpoints

```typescript
GET /api/products
  ?category=electronics
  &search=laptop
  &limit=20
  &offset=0

GET /api/products/:id
```

### Data Types

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  stock?: number;
  category?: string;
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

See [TESTING.md](TESTING.md) for detailed testing guide.

## 📦 Module Federation

```javascript
exposes: {
  './ProductGrid': './src/components/product-grid',
  './ProductCard': './src/components/product-card',
}

shared: {
  react: { singleton: true },
  'react-dom': { singleton: true },
  '@tanstack/react-query': { singleton: true }
}
```

## 🚢 Deployment

```bash
# Build optimized production bundle
npm run build

# Run production server
npm start

# Docker
docker build -t mfe-products .
docker run -p 3004:3004 mfe-products
```

## 🐛 Troubleshooting

**Backend unavailable?**
- Enable mock data: `NEXT_PUBLIC_USE_MOCK_DATA=true`
- Start product service: `npm run services:product`

**Tests failing?**
- Clear cache: `npm test -- --clearCache`
- Update snapshots: `npm test -- -u`

**Build errors?**
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 📄 Related Documentation

- [React Query Guide](docs/guides/REACT_QUERY_GUIDE.md)
- [Testing Guide](TESTING.md)
- [Main Project README](../../README.md)
- [Port Configuration](../../config/README.md)

## 🤝 Contributing

1. Create feature branch from `main`
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Update documentation
5. Submit pull request

## 📝 License

Internal use only - Shopping App Project
