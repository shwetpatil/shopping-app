# MFE Shell - Host Application

The main host application that loads and orchestrates all microfrontend modules.

## Architecture

This is the **shell/host** application that:
- Provides shared layout (Header, Footer)
- Manages global state (Auth, Cart)
- Loads remote microfrontends at runtime
- Handles routing and navigation

## Microfrontends Loaded

| MFE | Port | Components Exposed |
|-----|------|-------------------|
| Search | 3001 | SearchBar, FilterPanel |
| Wishlist | 3002 | WishlistButton, WishlistPage |
| Reviews | 3003 | ProductReviews, ReviewForm |
| Products | 3004 | ProductGrid, ProductCard, ProductDetail |
| Cart & Checkout | 3005 | CartPage, CheckoutFlow |

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SEARCH_MFE_URL=http://localhost:3001
NEXT_PUBLIC_WISHLIST_MFE_URL=http://localhost:3002
NEXT_PUBLIC_REVIEWS_MFE_URL=http://localhost:3003
NEXT_PUBLIC_PRODUCTS_MFE_URL=http://localhost:3004
NEXT_PUBLIC_CART_MFE_URL=http://localhost:3005
```

## Production Build

```bash
npm run build
npm start
```

## Module Federation

The shell uses Module Federation to dynamically load remote modules:

```javascript
// next.config.js
remotes: {
  search: 'search@http://localhost:3001/remoteEntry.js',
  wishlist: 'wishlist@http://localhost:3002/remoteEntry.js',
  // ... other remotes
}
```

## Shared Dependencies

All microfrontends share:
- `react` (singleton)
- `react-dom` (singleton)
- `@tanstack/react-query` (singleton)
- `axios` (shared instance)

## Communication

Microfrontends communicate via:
1. **React Context** - Auth, Cart state
2. **React Query Cache** - Data synchronization
3. **Event Bus** - Cross-module events
4. **URL Parameters** - Shared state via URL

## Deployment

The shell can be deployed independently:

```bash
# Docker
docker build -t mfe-shell .
docker run -p 3000:3000 mfe-shell

# Vercel/Netlify
vercel deploy
```

All remote MFE URLs are configured via environment variables for easy updates.
