# Wishlist Microfrontend

Independently deployable wishlist module for the shopping app.

## Team Ownership

**Team:** Engagement Team  
**Responsibilities:**
- Wishlist functionality
- Save for later features
- Wishlist analytics

## Exposed Components

| Component | Description | Props |
|-----------|-------------|-------|
| `WishlistButton` | Heart icon toggle button | `productId`, `variant`, `onToggle`, `isInWishlist` |
| `WishlistPage` | Full wishlist management page | - |

## Development

```bash
npm install
npm run dev  # Port 3002
```

## Exposed via Module Federation

```javascript
exposes: {
  './WishlistButton': './src/components/wishlist-button',
  './WishlistPage': './src/components/wishlist-page',
}
```

## Communication

Emits: `wishlist:item_added`, `wishlist:item_removed`  
Listens: `auth:logged_in`, `product:viewed`
