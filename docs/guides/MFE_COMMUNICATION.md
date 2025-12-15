# Microfrontend Communication Guide

## Overview

This document explains how microfrontends communicate in the Shopping App using the `@shopping-app/mfe-contracts` package.

## Architecture

```
┌─────────────────────────────────────────────────┐
│           @shopping-app/mfe-contracts           │
│  (Shared Types, Props, Events)                  │
└─────────────────────────────────────────────────┘
           ↑           ↑           ↑
           │           │           │
    ┌──────┴───┐  ┌───┴────┐  ┌──┴──────┐
    │  Shell   │  │ Search │  │ Products│
    │  MFE     │  │  MFE   │  │  MFE    │
    └──────────┘  └────────┘  └─────────┘
```

## Communication Methods

### 1. Shared Contracts Package

All MFEs import from `@shopping-app/mfe-contracts`:

```typescript
import type { 
  Product, 
  SearchFilters, 
  SearchBarProps 
} from '@shopping-app/mfe-contracts';
```

**Benefits:**
- Type safety across all MFEs
- Single source of truth
- Compile-time error checking
- IntelliSense support

### 2. Component Props (Direct Communication)

MFEs expose components with defined prop interfaces:

```typescript
// In Search MFE
export default function SearchBar({ 
  onSearch, 
  initialQuery 
}: SearchBarProps) {
  // Implementation
}

// In Shell (Host)
<SearchBar 
  initialQuery="laptop"
  onSearch={(filters) => {
    // Handle search
  }}
/>
```

**When to use:**
- Parent-child component relationships
- Direct data passing
- Callbacks and event handlers

### 3. Event Bus (Cross-MFE Communication)

For loosely coupled communication:

```typescript
import { mfeEventBus } from '@shopping-app/mfe-contracts';

// Publish from any MFE
mfeEventBus.publish('cart:add', {
  productId: '123',
  quantity: 1
});

// Subscribe from any MFE
const unsubscribe = mfeEventBus.subscribe('cart:add', (payload) => {
  console.log('Cart updated:', payload);
  updateCartCount();
});
```

**When to use:**
- Broadcasting state changes
- Notifying multiple MFEs
- Decoupled communication
- Cross-MFE coordination

### 4. React Hooks (Event Bus in Components)

Easy integration in React components:

```typescript
import { useMFEEvent, useMFEPublish } from '@shopping-app/mfe-contracts';

function MyComponent() {
  // Subscribe to events
  useMFEEvent('cart:add', (payload) => {
    console.log('Product added:', payload);
  });

  // Publish events
  const publishCartAdd = useMFEPublish('cart:add');
  
  const handleAddToCart = () => {
    publishCartAdd({ 
      productId: product.id, 
      quantity: 1 
    });
  };
}
```

### 5. Shared State (React Query Cache)

MFEs can share cached data:

```typescript
// In Products MFE
const { data: products } = useQuery({
  queryKey: ['products', filters],
  queryFn: fetchProducts
});

// In Cart MFE - access same cache
const { data: products } = useQuery({
  queryKey: ['products', filters]
});
```

**When to use:**
- Sharing server state
- Avoiding duplicate API calls
- Optimistic updates
- Cache invalidation

### 6. Context Providers (Shell)

Shell provides global contexts:

```typescript
// In Shell
<AuthProvider>
  <CartProvider>
    <QueryClientProvider>
      {children}
    </QueryClientProvider>
  </CartProvider>
</AuthProvider>

// In any MFE
const { user } = useAuth();
const { addToCart } = useCart();
```

**When to use:**
- Global application state
- Authentication
- Theme/configuration
- Shopping cart state

## Event Types Reference

### Authentication Events
```typescript
mfeEventBus.publish('auth:login', { user, token });
mfeEventBus.publish('auth:logout', {});
mfeEventBus.publish('auth:session-expired', {});
```

### Cart Events
```typescript
mfeEventBus.publish('cart:add', { productId, quantity });
mfeEventBus.publish('cart:update', { itemId, quantity });
mfeEventBus.publish('cart:remove', { itemId });
mfeEventBus.publish('cart:clear', {});
mfeEventBus.publish('cart:sync', { items, total });
```

### Wishlist Events
```typescript
mfeEventBus.publish('wishlist:add', { productId });
mfeEventBus.publish('wishlist:remove', { productId });
mfeEventBus.publish('wishlist:sync', { productIds });
```

### Search Events
```typescript
mfeEventBus.publish('search:filter', { query, category, minPrice, maxPrice });
mfeEventBus.publish('search:clear', {});
```

### Navigation Events
```typescript
mfeEventBus.publish('navigate', { path: '/products', query: { category: 'electronics' } });
```

### Notification Events
```typescript
mfeEventBus.publish('notification', { 
  message: 'Added to cart!', 
  variant: 'success' 
});
```

## Best Practices

### 1. Use Type-Safe Events

Always import event types from contracts:

```typescript
import type { MFEEventType, MFEEventPayload } from '@shopping-app/mfe-contracts';

// Type-safe publishing
const payload: MFEEventPayload<'cart:add'> = {
  productId: '123',
  quantity: 1
};
mfeEventBus.publish('cart:add', payload);
```

### 2. Clean Up Subscriptions

Always unsubscribe when component unmounts:

```typescript
useEffect(() => {
  const unsubscribe = mfeEventBus.subscribe('cart:add', handleCartAdd);
  return unsubscribe; // Cleanup
}, []);

// Or use hook (automatic cleanup)
useMFEEvent('cart:add', handleCartAdd);
```

### 3. Avoid Circular Dependencies

Events should flow in one direction:

```
User Action → Event → Listeners → Updates
```

Don't create loops:
```
❌ A publishes → B subscribes → B publishes → A subscribes (loop!)
```

### 4. Use Appropriate Communication Method

| Scenario | Method |
|----------|--------|
| Parent → Child data | Props |
| Child → Parent callback | Props (onXxx) |
| Sibling → Sibling | Event Bus |
| Global state | Context |
| Server data | React Query |
| User notifications | Event Bus |

### 5. Document Custom Events

If you add new event types, update contracts:

```typescript
// In @shopping-app/mfe-contracts
export interface CustomEvent {
  type: 'custom:event';
  payload: {
    // Define payload shape
  };
}

// Add to union
export type MFEEvent = ... | CustomEvent;
```

### 6. Debug Events

Use the event logger in development:

```typescript
import { useMFEEventLogger } from '@shopping-app/mfe-contracts';

function App() {
  // Logs all events in console
  useMFEEventLogger(process.env.NODE_ENV === 'development');
  
  return <YourApp />;
}
```

## Example: Complete Flow

### Scenario: User adds product to cart

```typescript
// 1. Products MFE - User clicks "Add to Cart"
function ProductCard({ product }: ProductCardProps) {
  const publishCartAdd = useMFEPublish('cart:add');
  
  const handleAddToCart = () => {
    // Publish event
    publishCartAdd({
      productId: product.id,
      quantity: 1
    });
  };
  
  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}

// 2. Cart MFE - Subscribes to cart events
function CartSummary() {
  const [itemCount, setItemCount] = useState(0);
  
  useMFEEvent('cart:add', async (payload) => {
    // Add to cart via API
    await addToCartAPI(payload);
    
    // Update local state
    setItemCount(prev => prev + payload.quantity);
    
    // Publish sync event
    mfeEventBus.publish('cart:sync', {
      items: updatedItems,
      total: newTotal
    });
  });
  
  return <div>Cart ({itemCount})</div>;
}

// 3. Shell - Shows notification
function Shell() {
  useMFEEvent('cart:add', (payload) => {
    // Show success notification
    mfeEventBus.publish('notification', {
      message: 'Added to cart!',
      variant: 'success'
    });
  });
  
  return <App />;
}

// 4. Notification MFE - Displays notification
function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  
  useMFEEvent('notification', (payload) => {
    setNotifications(prev => [...prev, payload]);
  });
  
  return (
    <div>
      {notifications.map(n => <Toast {...n} />)}
    </div>
  );
}
```

## Troubleshooting

### Events not received

1. Check event type spelling
2. Verify subscription is active
3. Check if component is mounted
4. Look for console errors

### Type errors

1. Update `@shopping-app/mfe-contracts` to latest version
2. Rebuild contracts package: `cd packages/mfe-contracts && npm run build`
3. Clear TypeScript cache: `rm -rf node_modules/.cache`

### Memory leaks

1. Always unsubscribe: `return unsubscribe;` in useEffect
2. Use `useMFEEvent` hook (handles cleanup automatically)
3. Don't create subscriptions in render

## Resources

- [Contracts Package README](../../packages/mfe-contracts/README.md)
- [Event Bus Source](../../packages/mfe-contracts/src/events/bus.ts)
- [Type Definitions](../../packages/mfe-contracts/src/types/)
- [Component Props](../../packages/mfe-contracts/src/components/props.ts)
