# Microfrontend Applications

This directory contains all 6 independent microfrontend applications for the Shopping App platform. Each MFE is owned by a specific team and can be developed, tested, and deployed independently.

## 🏗️ Applications

### [mfe-shell](mfe-shell/) - Host Container
**Port:** 3000  
**Team:** Platform Team  
**Status:** ✅ Production Ready

**Purpose:**
Host container application that orchestrates all other microfrontends. Provides global layout, navigation, and authentication.

**Key Responsibilities:**
- Host container for all MFEs
- Global navigation and layout
- Centralized authentication
- Routing orchestration
- Global error handling

**Key Components:**
- Layout wrapper
- Navigation bar
- Auth provider
- Error boundary

---

### [mfe-search](mfe-search/) - Product Search
**Port:** 3001  
**Team:** Search Team  
**Status:** ✅ Production Ready

**Purpose:**
Product search functionality with advanced filtering and sorting.

**Key Responsibilities:**
- Product search with autocomplete
- Advanced filtering (category, price, brand)
- Sort options (price, popularity, rating)
- Search result display

**Key Components:**
- `<SearchBar />` - Main search input with autocomplete
- `<FilterPanel />` - Advanced filters

**Events Published:**
- `search:query` - User performs search
- `search:filter` - Filters applied
- `search:clear` - Search cleared

**Events Subscribed:**
- `product:view` - Track search result clicks

---

### [mfe-products](mfe-products/) - Product Catalog
**Port:** 3004  
**Team:** Commerce Team  
**Status:** ✅ Production Ready

**Purpose:**
Product catalog with listing and detail views.

**Key Responsibilities:**
- Product grid display
- Product card rendering
- Product details
- Product recommendations

**Key Components:**
- `<ProductGrid />` - Product listing with pagination
- `<ProductCard />` - Individual product card

**Events Published:**
- `product:view` - Product viewed
- `product:click` - Product clicked

**Events Subscribed:**
- `cart:add` - Update UI when product added to cart
- `wishlist:add` - Update UI when added to wishlist

---

### [mfe-cart](mfe-cart/) - Shopping Cart
**Port:** 3005  
**Team:** Commerce Team  
**Status:** ✅ Production Ready

**Purpose:**
Shopping cart management and checkout flow.

**Key Responsibilities:**
- Shopping cart display
- Quantity management
- Cart persistence
- Checkout process
- Order summary

**Key Components:**
- `<CartSummary />` - Cart display with items
- `<CheckoutFlow />` - Multi-step checkout

**Events Published:**
- `cart:add` - Item added to cart
- `cart:remove` - Item removed from cart
- `cart:update` - Cart quantity updated
- `cart:clear` - Cart cleared
- `checkout:start` - Checkout initiated
- `checkout:complete` - Order placed

**Events Subscribed:**
- `product:view` - Show related products in cart

---

### [mfe-wishlist](mfe-wishlist/) - Wishlist Management
**Port:** 3002  
**Team:** Engagement Team  
**Status:** ✅ Production Ready

**Purpose:**
Wishlist management and save-for-later functionality.

**Key Responsibilities:**
- Wishlist display
- Add/remove from wishlist
- Wishlist persistence
- Move to cart functionality

**Key Components:**
- `<WishlistButton />` - Add to wishlist button
- `<WishlistGrid />` - Wishlist items display

**Events Published:**
- `wishlist:add` - Item added to wishlist
- `wishlist:remove` - Item removed from wishlist

**Events Subscribed:**
- `cart:add` - Remove from wishlist when added to cart

---

### [mfe-reviews](mfe-reviews/) - Product Reviews
**Port:** 3003  
**Team:** Engagement Team  
**Status:** ✅ Production Ready

**Purpose:**
Product reviews and rating system.

**Key Responsibilities:**
- Display product reviews
- Submit new reviews
- Rating aggregation
- Review moderation

**Key Components:**
- `<ProductReviews />` - Reviews display
- `<ReviewForm />` - Submit review form
- `<RatingStars />` - Star rating display

**Events Published:**
- `review:submit` - Review submitted
- `review:helpful` - Review marked helpful

**Events Subscribed:**
- `product:view` - Load reviews for product

---

## 🎯 Technology Stack

All MFEs use:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS
- **State:** React Context + Hooks
- **Contracts:** @shopping-app/mfe-contracts v1.1.0
- **Utilities:** @shopping-app/shared-ui v1.0.0

## 📦 Shared Dependencies

### Required Packages
```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@shopping-app/mfe-contracts": "workspace:*",
    "@shopping-app/shared-ui": "workspace:*"
  }
}
```

## 🚀 Development

### Start Individual MFE
```bash
cd apps/mfe-shell
npm install
npm run dev
```

### Start All MFEs
```bash
# From root
./start-all.sh
```

### Build MFE
```bash
cd apps/mfe-shell
npm run build
npm start
```

## 🐳 Docker Support

Each MFE has its own Dockerfile:

```bash
# Build individual MFE
cd apps/mfe-shell
docker build -t mfe-shell .
docker run -p 3000:3000 mfe-shell

# Build all with docker-compose
docker-compose -f docker-compose.mfe.yml up
```

## 📊 MFE Communication

### Event-Driven Architecture

MFEs communicate via the EventBus from `@shopping-app/mfe-contracts`:

```typescript
import { mfeEventBus } from '@shopping-app/mfe-contracts';

// Publish event
mfeEventBus.publish('cart:add', {
  productId: '123',
  quantity: 1
});

// Subscribe to event
mfeEventBus.subscribe('cart:add', (event) => {
  console.log('Product added:', event.payload);
});
```

### Event Flow Example

```
┌─────────────┐
│  Products   │ ──── product:view ────┐
│     MFE     │                       │
└─────────────┘                       ▼
                              ┌─────────────┐
                              │  EventBus   │
                              └─────────────┘
┌─────────────┐                       │
│    Cart     │ ◄──── cart:add ───────┘
│     MFE     │
└─────────────┘
```

## 🔒 Authentication

All MFEs use shared auth from `@shopping-app/mfe-contracts`:

```typescript
import { useAuth } from '@shopping-app/mfe-contracts';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <div>Welcome, {user.name}!</div>;
};
```

## 📈 Performance Monitoring

All MFEs include performance monitoring:

```typescript
import { useMFELoadTime, useMFEInteraction } from '@shopping-app/mfe-contracts';

const ProductCard = ({ product }) => {
  // Track component load time
  useMFELoadTime('ProductCard');
  
  // Track user interactions
  const trackInteraction = useMFEInteraction('ProductCard');
  
  const handleClick = () => {
    trackInteraction('product_click', { productId: product.id });
  };
  
  return <div onClick={handleClick}>{/* ... */}</div>;
};
```

## 🚩 Feature Flags

Control feature rollout across MFEs:

```typescript
import { featureFlags } from '@shopping-app/mfe-contracts';

const ProductCard = () => {
  const showNewDesign = featureFlags.isEnabled('new-product-card', {
    userId: user.id
  });
  
  return showNewDesign ? <NewProductCard /> : <OldProductCard />;
};
```

## 🛡️ Error Handling

Each MFE has error boundaries:

```typescript
import { MFEErrorBoundary } from '@shopping-app/mfe-contracts';

export default function RootLayout({ children }) {
  return (
    <MFEErrorBoundary mfeName="products" onError={(error) => {
      // Send to monitoring service
      console.error('MFE Error:', error);
    }}>
      {children}
    </MFEErrorBoundary>
  );
}
```

## 📖 Documentation

- [B2B Architecture Guide](../docs/architecture/MICROFRONTEND_B2B_GUIDE.md)
- [MFE Communication](../docs/guides/MFE_COMMUNICATION.md)
- [Using Contracts](../docs/examples/USING_CONTRACTS.md)
- [Development Guide](../docs/guides/DEVELOPMENT.md)
- [Deployment Guide](../docs/guides/DEPLOYMENT.md)

## 🎯 Team Ownership

| MFE | Team | Slack Channel |
|-----|------|---------------|
| **mfe-shell** | Platform | #team-platform |
| **mfe-search** | Search | #team-search |
| **mfe-products** | Commerce | #team-commerce |
| **mfe-cart** | Commerce | #team-commerce |
| **mfe-wishlist** | Engagement | #team-engagement |
| **mfe-reviews** | Engagement | #team-engagement |

## ✅ Quality Standards

All MFEs must:
- ✅ Use TypeScript with strict mode
- ✅ Include error boundaries
- ✅ Use contracts package for props
- ✅ Publish/subscribe to relevant events
- ✅ Include performance monitoring
- ✅ Support feature flags
- ✅ Have Dockerfile for deployment
- ✅ Include .env.example
- ✅ Have comprehensive README
- ✅ Build without errors
- ✅ Follow B2B microfrontend patterns
