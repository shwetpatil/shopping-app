# TanStack Query Implementation Guide

## Overview

All microfrontends now use **TanStack Query (React Query v5)** for data fetching, caching, and state management.

## Benefits

✅ **Automatic Caching** - Data is cached and reused  
✅ **Background Refetching** - Fresh data without loading states  
✅ **Optimistic Updates** - Instant UI updates  
✅ **Request Deduplication** - Multiple components, one request  
✅ **Retry Logic** - Automatic retries on failure  
✅ **DevTools** - Visual debugging in development  
✅ **Type Safety** - Full TypeScript support  

## Setup (Already Done for Products MFE)

### 1. Install Dependencies
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 2. Create Query Configuration
File: `src/lib/query-config.ts`
- Configures QueryClient with defaults
- Defines query keys factory for type-safe keys

### 3. Create Query Provider
File: `src/lib/query-provider.tsx`
- Wraps app with QueryClientProvider
- Includes DevTools in development

### 4. Add Provider to Layout
File: `src/app/layout.tsx`
```tsx
import { QueryProvider } from '../lib/query-provider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 5. Create Query Hooks
File: `src/hooks/use-[domain]-queries.ts`
```tsx
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-config';

export function useProducts(options) {
  return useQuery({
    queryKey: queryKeys.products.list(options),
    queryFn: () => fetchProducts(options),
  });
}
```

## Usage Examples

### Basic Query
```tsx
import { useProducts } from '../hooks/use-product-queries';

function ProductList() {
  const { data, isLoading, error, refetch } = useProducts();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Query with Filters
```tsx
const { data } = useProducts({ 
  category: 'electronics',
  limit: 10 
});
```

### Single Item Query
```tsx
const { data: product } = useProduct(productId);
```

### Prefetching (on hover)
```tsx
const prefetchProduct = usePrefetchProduct();

<div onMouseEnter={() => prefetchProduct(product.id)}>
  {product.name}
</div>
```

### Mutations
```tsx
const { mutate, isPending } = useCreateProduct();

<button 
  onClick={() => mutate(newProduct)}
  disabled={isPending}
>
  Create Product
</button>
```

### Invalidating Cache
```tsx
const { invalidateAll } = useInvalidateProducts();

// After creating/updating a product
await createProduct(data);
invalidateAll(); // Refetch all product queries
```

## Query Keys Structure

Organized hierarchically for easy invalidation:

```typescript
queryKeys.products.all          // ['products']
queryKeys.products.lists()      // ['products', 'list']
queryKeys.products.list(filter) // ['products', 'list', { filters }]
queryKeys.products.detail(id)   // ['products', 'detail', id]
```

## Configuration Options

### Global Defaults (query-config.ts)
```typescript
{
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 10 * 60 * 1000,        // 10 minutes
  retry: 2,                       // Retry twice
  refetchOnWindowFocus: true,     // Refetch when window gains focus
}
```

### Per-Query Overrides
```typescript
const { data } = useProducts(options, {
  staleTime: 0,           // Always consider stale
  refetchInterval: 30000, // Refetch every 30 seconds
  enabled: false,         // Disable automatic fetching
});
```

## DevTools

In development, React Query DevTools appear in bottom right corner:
- 🟢 Green: Fresh data
- 🟡 Yellow: Stale data (will refetch)
- 🔴 Red: Error state
- ⚪ Gray: Inactive (not being used)

## Migration from Custom Hooks

### Before (Custom Hook)
```tsx
const { products, loading, error, refetch } = useProducts();
```

### After (React Query)
```tsx
const { data: products = [], isLoading, error, refetch } = useProducts();
```

## Next Steps for Other MFEs

1. **Cart MFE**: Create `use-cart-queries.ts`
2. **Search MFE**: Create `use-search-queries.ts`
3. **Wishlist MFE**: Create `use-wishlist-queries.ts`
4. **Reviews MFE**: Create `use-review-queries.ts`

Copy the setup from Products MFE and adapt query keys/functions for each domain.

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Query Keys Guide](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [DevTools Guide](https://tanstack.com/query/latest/docs/framework/react/devtools)
