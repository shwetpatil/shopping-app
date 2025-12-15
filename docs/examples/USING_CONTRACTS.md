# Using MFE Contracts - Complete Examples

This guide shows how to use the updated MFE components with the contracts package.

## Installation

All MFEs now have the contracts package installed:

```bash
# Already installed in all MFEs:
# - apps/mfe-shell
# - apps/mfe-search
# - apps/mfe-products
# - apps/mfe-cart
# - apps/mfe-wishlist
# - apps/mfe-reviews
```

## Updated Components

### 1. Search MFE - SearchBar

**Location:** `apps/mfe-search/src/components/search-bar.tsx`

**What's New:**
- ✅ Uses `SearchBarProps` from contracts
- ✅ Publishes `search:filter` events
- ✅ Type-safe event payload

**Usage Example:**

```tsx
import { SearchBar } from '@/components/search-bar';

export default function Page() {
  return (
    <SearchBar
      placeholder="Search for products..."
      initialQuery=""
      onSearch={(filters) => {
        console.log('Search filters:', filters);
      }}
      className="mb-4"
    />
  );
}
```

**Events Published:**
- `search:filter` with `{ query: string }` payload

---

### 2. Products MFE - ProductGrid

**Location:** `apps/mfe-products/src/components/product-grid.tsx`

**What's New:**
- ✅ Uses `ProductGridProps` from contracts
- ✅ Publishes `cart:add` events when "Add to Cart" clicked
- ✅ Accepts products prop for dynamic data
- ✅ Supports loading state and limit

**Usage Example:**

```tsx
import { ProductGrid } from '@/components/product-grid';

export default function Page() {
  return (
    <ProductGrid
      products={[
        {
          id: '1',
          name: 'Product 1',
          price: 99.99,
          imageUrl: '/img.jpg',
          rating: 4.5,
          reviewCount: 100
        }
      ]}
      onProductClick={(product) => {
        console.log('Product clicked:', product);
      }}
      loading={false}
      limit={12}
      className="my-8"
    />
  );
}
```

**Events Published:**
- `cart:add` with `{ productId: string, quantity: number }` payload

---

### 3. Cart MFE - CartSummary

**Location:** `apps/mfe-cart/src/components/cart-summary.tsx`

**What's New:**
- ✅ Uses `CartSummaryProps` from contracts
- ✅ **Subscribes to `cart:add` events** (listens for products added from other MFEs!)
- ✅ Publishes `cart:sync` events when cart changes
- ✅ Supports 3 variants: `mini`, `full`, `icon-only`

**Usage Example:**

```tsx
import { CartSummary } from '@/components/cart-summary';

export default function Page() {
  return (
    <CartSummary
      variant="full"
      showItems={true}
      onCheckout={() => {
        console.log('Proceed to checkout');
      }}
      onViewCart={() => {
        console.log('View cart');
      }}
      className="sticky top-4"
    />
  );
}
```

**Events Subscribed:**
- `cart:add` - Automatically adds items to cart

**Events Published:**
- `cart:sync` with `{ items: CartItem[], total: number }` payload

---

### 4. Wishlist MFE - WishlistButton

**Location:** `apps/mfe-wishlist/src/components/wishlist-button.tsx`

**What's New:**
- ✅ Uses `WishlistButtonProps` from contracts
- ✅ Publishes `wishlist:add` and `wishlist:remove` events
- ✅ Supports 3 variants: `icon`, `button`, `icon-with-count`
- ✅ Type-safe callbacks

**Usage Example:**

```tsx
import { WishlistButton } from '@/components/wishlist-button';

export default function Page() {
  return (
    <div>
      {/* Icon variant */}
      <WishlistButton
        productId="123"
        variant="icon"
        size="md"
        isWishlisted={false}
        onToggle={(productId, isWishlisted) => {
          console.log(`Product ${productId} wishlisted: ${isWishlisted}`);
        }}
      />

      {/* Button variant */}
      <WishlistButton
        productId="123"
        variant="button"
        size="lg"
        onToggle={(productId, isWishlisted) => {
          console.log('Wishlist toggled');
        }}
      />
    </div>
  );
}
```

**Events Published:**
- `wishlist:add` with `{ productId: string }` payload
- `wishlist:remove` with `{ productId: string }` payload

---

### 5. Reviews MFE - ProductReviews

**Location:** `apps/mfe-reviews/src/components/product-reviews.tsx`

**What's New:**
- ✅ Uses `ProductReviewsProps` from contracts
- ✅ Supports `allowWrite` prop to hide/show review form
- ✅ Supports `limit` and `sortBy` props
- ✅ Type-safe props

**Usage Example:**

```tsx
import { ProductReviews } from '@/components/product-reviews';

export default function Page() {
  return (
    <ProductReviews
      productId="123"
      limit={10}
      sortBy="recent"
      allowWrite={true}
      className="mt-8"
    />
  );
}
```

---

## Cross-MFE Communication Example

### Scenario: User adds product to cart from Products MFE

**Step 1:** User clicks "Add to Cart" in Products MFE

```tsx
// apps/mfe-products/src/components/product-grid.tsx
const handleAddToCart = (productId: string) => {
  // Publishes event that Cart MFE will receive
  publishCartAdd({ productId, quantity: 1 });
};
```

**Step 2:** Cart MFE automatically receives the event

```tsx
// apps/mfe-cart/src/components/cart-summary.tsx
useMFEEvent('cart:add', (payload) => {
  console.log('Cart: Received cart:add event', payload);
  // Add item to cart
  const newItem = {
    id: payload.productId,
    name: 'New Product',
    price: 99.99,
    quantity: payload.quantity,
  };
  setCartItems(prev => [...prev, newItem]);
});
```

**Step 3:** Cart publishes sync event

```tsx
// apps/mfe-cart/src/components/cart-summary.tsx
useEffect(() => {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  publishCartSync({ items: cartItems, total });
}, [cartItems]);
```

**Result:** The shell or any other MFE can listen to `cart:sync` to show cart count, notifications, etc.

---

## Shell Integration Example

Update your shell to use all the MFE components:

```tsx
// apps/mfe-shell/src/app/page.tsx
'use client';

import dynamic from 'next/dynamic';
import type { SearchBarProps, ProductGridProps, CartSummaryProps } from '@shopping-app/mfe-contracts';
import { useMFEEvent, useMFEPublish } from '@shopping-app/mfe-contracts';

// Dynamically load remote MFE components
const SearchBar = dynamic<SearchBarProps>(() => 
  import('search-mfe/SearchBar').then((mod) => mod.SearchBar)
);

const ProductGrid = dynamic<ProductGridProps>(() => 
  import('products-mfe/ProductGrid').then((mod) => mod.ProductGrid)
);

const CartSummary = dynamic<CartSummaryProps>(() => 
  import('cart-mfe/CartSummary').then((mod) => mod.CartSummary)
);

export default function HomePage() {
  // Subscribe to events
  useMFEEvent('cart:add', (payload) => {
    console.log('Shell: Product added to cart', payload);
    // Show notification
  });

  useMFEEvent('cart:sync', (payload) => {
    console.log('Shell: Cart synced', payload.total);
    // Update cart badge
  });

  return (
    <div className="container mx-auto p-4">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Shopping App</h1>
        <CartSummary variant="icon-only" />
      </header>

      <SearchBar placeholder="Search products..." />

      <main className="mt-8">
        <ProductGrid limit={12} />
      </main>

      <aside className="fixed right-4 top-20">
        <CartSummary variant="mini" showItems={false} />
      </aside>
    </div>
  );
}
```

---

## Event Flow Diagram

```
┌─────────────────┐
│  Products MFE   │
│  ProductGrid    │
└────────┬────────┘
         │
         │ Publishes: cart:add
         │ { productId, quantity }
         ▼
┌─────────────────────────────────┐
│      Event Bus (Window)         │
│  mfeEventBus.publish(...)       │
└────────┬───────────┬────────────┘
         │           │
         ▼           ▼
┌────────────┐  ┌───────────┐
│  Cart MFE  │  │   Shell   │
│  Listens   │  │  Listens  │
│  Updates   │  │  Shows    │
│  Cart      │  │  Toast    │
└─────┬──────┘  └───────────┘
      │
      │ Publishes: cart:sync
      │ { items, total }
      ▼
┌─────────────────┐
│  All Listeners  │
│  Update UI      │
└─────────────────┘
```

---

## Type Safety Benefits

**Before (without contracts):**
```tsx
// ❌ No type safety, runtime errors
onSearch?.("query"); // Wrong signature!
publishEvent('cart:add', { id: '123' }); // Missing 'quantity'!
```

**After (with contracts):**
```tsx
// ✅ Full type safety, compile-time checks
onSearch?.({ query: 'laptop' }); // TypeScript error if wrong!
publishCartAdd({ productId: '123', quantity: 1 }); // ✅ Correct!
publishCartAdd({ productId: '123' }); // ❌ TypeScript error: missing 'quantity'
```

---

## Testing Cross-MFE Communication

### Test 1: Add to Cart Flow

1. Start all MFEs:
   ```bash
   ./start-all.sh
   ```

2. Open browser console

3. Click "Add to Cart" in Products MFE

4. Check console logs:
   ```
   Cart: Received cart:add event { productId: '123', quantity: 1 }
   Shell: Product added to cart { productId: '123', quantity: 1 }
   Shell: Cart synced 279.97
   ```

### Test 2: Search Flow

1. Type in SearchBar

2. Press Enter

3. Check console logs:
   ```
   Shell: Search filters { query: 'laptop' }
   ```

### Test 3: Wishlist Flow

1. Click heart icon on product

2. Check console logs:
   ```
   Wishlist: Added product 123
   ```

---

## Next Steps

1. **Add Module Federation** to load components at runtime
2. **Add shared state management** using React Context or Zustand
3. **Add API integration** to fetch real data
4. **Add authentication** using the auth events
5. **Add notifications** by subscribing to all events in shell

---

## Troubleshooting

### Issue: Events not received

**Solution:** Make sure all MFEs are running on their designated ports:
- Shell: http://localhost:3000
- Search: http://localhost:3001
- Products: http://localhost:3004
- Cart: http://localhost:3005
- Wishlist: http://localhost:3002
- Reviews: http://localhost:3003

### Issue: TypeScript errors

**Solution:** Rebuild the contracts package:
```bash
cd packages/mfe-contracts
npm run build
```

Then reinstall in MFEs:
```bash
cd apps/mfe-shell
npm install ../../packages/mfe-contracts
```

### Issue: Events work but types are wrong

**Solution:** Check that you're importing the correct event hook:
```tsx
// ✅ Correct
import { useMFEPublish } from '@shopping-app/mfe-contracts';
const publish = useMFEPublish('cart:add');
publish({ productId: '123', quantity: 1 });

// ❌ Wrong
import { mfeEventBus } from '@shopping-app/mfe-contracts';
mfeEventBus.publish('cart:add', { id: '123' }); // Wrong payload!
```

---

## Summary

✅ All MFE components updated to use contracts
✅ Type-safe communication between MFEs
✅ Event-based architecture for loose coupling
✅ Full TypeScript IntelliSense support
✅ Compile-time error checking
✅ Living documentation via types

Your microfrontends now communicate safely and efficiently! 🎉
