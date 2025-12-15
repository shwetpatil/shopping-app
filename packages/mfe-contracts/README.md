# @shopping-app/mfe-contracts

Shared TypeScript contracts and interfaces for microfrontend communication.

## Purpose

This package provides:

1. **Type Definitions** - Shared domain types (Product, Cart, User, etc.)
2. **Component Props Contracts** - TypeScript interfaces for remote MFE components
3. **Event System** - Type-safe pub-sub for cross-MFE communication
4. **React Hooks** - Easy integration with React components

## Installation

```bash
npm install @shopping-app/mfe-contracts
```

## Usage

### Type Definitions

```typescript
import type { Product, Cart, User } from '@shopping-app/mfe-contracts';

const product: Product = {
  id: '1',
  name: 'Example Product',
  price: 29.99,
  // ... other fields
};
```

### Component Props

```typescript
import type { SearchBarProps, ProductGridProps } from '@shopping-app/mfe-contracts';

// Define component with contract
export default function SearchBar({ onSearch, initialQuery }: SearchBarProps) {
  // Implementation
}
```

### Event System

```typescript
import { mfeEventBus, useMFEEvent, useMFEPublish } from '@shopping-app/mfe-contracts';

// Publish events
mfeEventBus.publish('cart:add', {
  productId: '123',
  quantity: 1
});

// Subscribe to events
const unsubscribe = mfeEventBus.subscribe('cart:add', (payload) => {
  console.log('Product added:', payload);
});

// In React components
function MyComponent() {
  // Subscribe to events
  useMFEEvent('cart:add', (payload) => {
    console.log('Cart updated:', payload);
  });

  // Publish events
  const publishCartAdd = useMFEPublish('cart:add');
  
  const handleAdd = () => {
    publishCartAdd({ productId: '123', quantity: 1 });
  };
}
```

## Event Types

All events are type-safe using discriminated unions:

- **Authentication**: `auth:login`, `auth:logout`, `auth:session-expired`
- **Cart**: `cart:add`, `cart:update`, `cart:remove`, `cart:clear`, `cart:sync`
- **Wishlist**: `wishlist:add`, `wishlist:remove`, `wishlist:sync`
- **Search**: `search:filter`, `search:clear`
- **Navigation**: `navigate`
- **Notifications**: `notification`

## Component Contracts

Each MFE exposes components with defined prop interfaces:

### Search MFE
- `SearchBarProps`
- `FilterPanelProps`

### Products MFE
- `ProductGridProps`
- `ProductCardProps`

### Wishlist MFE
- `WishlistButtonProps`
- `WishlistPanelProps`

### Reviews MFE
- `ProductReviewsProps`
- `ReviewFormProps`

### Cart MFE
- `CartSummaryProps`
- `CheckoutFlowProps`
- `CartDrawerProps`

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Clean
npm run clean
```

## Architecture

This package is the **contract layer** between microfrontends. It ensures:

1. **Type Safety** - Catch errors at compile time
2. **Consistent APIs** - All MFEs use same interfaces
3. **Loose Coupling** - MFEs depend on contracts, not each other
4. **Documentation** - Types serve as living documentation

## Best Practices

1. **Version carefully** - Breaking changes affect all MFEs
2. **Use semantic versioning** - Major version for breaking changes
3. **Keep it thin** - Only shared contracts, no implementation
4. **Document changes** - Update CHANGELOG.md
5. **Test thoroughly** - Contracts are critical infrastructure
