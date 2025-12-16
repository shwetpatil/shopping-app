# Micro-Frontend Architecture - Cart Separation

## Overview

Cart functionality has been properly separated from Products MFE into its own Cart MFE, following micro-frontend best practices.

## Architecture Decision

### Why Separate Cart MFE?

1. **Single Responsibility**: Each MFE should have one clear purpose
2. **Independent Deployment**: Cart can be updated without touching Products
3. **Team Ownership**: Separate teams can own different MFEs
4. **Scalability**: Better performance and loading optimization
5. **Reusability**: Cart can be used by multiple product MFEs

## Current Structure

```
apps/
├── mfe-products/          # Products catalog and details
│   ├── Product listing
│   ├── Product details
│   ├── Search & filters
│   └── Wishlist
│
├── mfe-cart/              # Shopping cart (MOVED HERE)
│   ├── Cart state management
│   ├── Cart UI (button & drawer)
│   ├── Checkout flow
│   └── Cart persistence
│
├── mfe-shell/             # Main shell/host
├── mfe-search/            # Search functionality
├── mfe-reviews/           # Product reviews
└── mfe-wishlist/          # User wishlist
```

## Communication Flow

### Event-Driven Architecture

```typescript
// Products MFE → Cart MFE
// When user clicks "Add to Cart"
window.dispatchEvent(new CustomEvent('addToCart', {
  detail: {
    product: {
      id: string,
      name: string,
      price: number,
      imageUrl: string,
      category: string,
      description: string
    },
    quantity: number
  }
}));

// Cart MFE → All MFEs
// When cart state changes
window.dispatchEvent(new CustomEvent('cartUpdated', {
  detail: {
    action: 'add' | 'remove' | 'update' | 'clear',
    productId?: string,
    quantity?: number
  }
}));
```

## Products MFE Changes

### Before (Incorrect)
```typescript
// Products MFE had direct cart integration
import { useCart } from '@/contexts/cart-context';
import { CartButton } from '@/components/cart-button';

const { addToCart } = useCart();
addToCart(product, quantity);
```

### After (Correct)
```typescript
// Products MFE emits events only
const handleAddToCart = () => {
  window.dispatchEvent(new CustomEvent('addToCart', {
    detail: { product, quantity }
  }));
};
```

## Cart MFE Implementation

### Files Created

```
apps/mfe-cart/
├── src/
│   ├── contexts/
│   │   └── cart-context.tsx        # Cart state management
│   ├── components/
│   │   └── cart-button.tsx         # Cart UI component
│   └── app/
│       └── layout.tsx              # Cart provider wrapper
└── CART_INTEGRATION.md             # Integration guide
```

### Key Features

1. **Cart Context**: Global cart state management
2. **Event Listeners**: Listen for `addToCart` events
3. **Event Emitters**: Emit `cartUpdated` events
4. **localStorage**: Persistent cart across sessions
5. **Cart UI**: Floating button with drawer

## Integration Points

### Shell MFE Setup

The Shell MFE should render the Cart globally:

```tsx
// apps/mfe-shell/src/app/layout.tsx
import { CartProvider } from '@mfe-cart/contexts/cart-context';
import { CartButton } from '@mfe-cart/components/cart-button';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CartProvider>
          {children}
          <CartButton />  {/* Global cart button */}
        </CartProvider>
      </body>
    </html>
  );
}
```

### Products MFE Integration

```typescript
// apps/mfe-products/src/app/products/[id]/page.tsx
const handleAddToCart = () => {
  // Emit event for Cart MFE
  window.dispatchEvent(new CustomEvent('addToCart', {
    detail: {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        description: product.description
      },
      quantity: selectedQuantity
    }
  }));
  
  // Optional: Show confirmation
  alert(`Added ${quantity} ${product.name} to cart!`);
};
```

## Benefits Achieved

### 1. Clear Separation of Concerns
- **Products MFE**: Product catalog, details, search, filters
- **Cart MFE**: Cart operations, checkout, persistence

### 2. Independent Development
- Cart team can work independently
- No merge conflicts between teams
- Faster development cycles

### 3. Better Performance
- Smaller bundle sizes per MFE
- Lazy loading of cart functionality
- Optimized loading strategies

### 4. Easier Testing
- Unit test each MFE separately
- Integration tests for events
- No tight coupling

### 5. Scalability
- Cart can serve multiple product MFEs
- Easy to add new MFEs
- Shared cart across all products

## Module Federation (Optional)

For production, use Module Federation to share components:

```javascript
// apps/mfe-cart/next.config.js
{
  webpack: (config) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'cart',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './cart-context': './src/contexts/cart-context.tsx',
          './cart-button': './src/components/cart-button.tsx',
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
        },
      })
    );
    return config;
  }
}

// apps/mfe-products/next.config.js
{
  webpack: (config) => {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'products',
        remotes: {
          cart: 'cart@http://localhost:3002/_next/static/chunks/remoteEntry.js',
        },
      })
    );
    return config;
  }
}
```

## Migration Checklist

- [x] Create Cart MFE structure
- [x] Move cart-context.tsx to Cart MFE
- [x] Move cart-button.tsx to Cart MFE
- [x] Remove cart imports from Products MFE
- [x] Update Products MFE to emit events
- [x] Add event listeners in Cart MFE
- [x] Update documentation
- [x] Create integration guide
- [ ] Update Shell MFE to include CartButton
- [ ] Test cross-MFE communication
- [ ] Setup Module Federation (optional)

## Testing Strategy

### Unit Tests

```typescript
// Test Products MFE event emission
test('emits addToCart event', () => {
  const listener = jest.fn();
  window.addEventListener('addToCart', listener);
  
  // Trigger add to cart
  fireEvent.click(addToCartButton);
  
  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({
      detail: expect.objectContaining({
        product: expect.any(Object),
        quantity: 1
      })
    })
  );
});

// Test Cart MFE event handling
test('handles addToCart event', () => {
  // Emit event
  window.dispatchEvent(new CustomEvent('addToCart', {
    detail: { product: mockProduct, quantity: 2 }
  }));
  
  // Verify cart state updated
  expect(screen.getByText('2')).toBeInTheDocument(); // badge
});
```

### Integration Tests

```typescript
test('Products → Cart integration', () => {
  // 1. Render both MFEs
  render(<ProductsApp />);
  render(<CartApp />);
  
  // 2. Add product from Products MFE
  fireEvent.click(screen.getByText('Add to Cart'));
  
  // 3. Verify cart updated
  expect(screen.getByLabelText('Open cart')).toHaveTextContent('1');
});
```

## Troubleshooting

### Events not working
- Ensure Cart MFE is mounted before Products
- Check event names match exactly
- Verify detail structure matches interface

### Cart not persisting
- Check localStorage is enabled
- Verify CART_STORAGE_KEY is unique
- Check for localStorage quota

### State not syncing
- Ensure cartUpdated events are emitted
- Check all MFEs listen for updates
- Verify event detail includes necessary data

## Future Enhancements

- [ ] Implement Module Federation
- [ ] Add GraphQL subscriptions for real-time sync
- [ ] Implement server-side cart for authenticated users
- [ ] Add cart analytics and tracking
- [ ] Implement cart abandonment recovery

## Documentation

- [Cart Integration Guide](../mfe-cart/CART_INTEGRATION.md)
- [Products MFE Documentation](./docs/README.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

---

**Date**: December 16, 2025  
**Status**: Complete ✅  
**Architecture**: Micro-Frontend with Event-Driven Communication
