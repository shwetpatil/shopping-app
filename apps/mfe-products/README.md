# Products Microfrontend

Independently deployable products catalog module for the shopping app.

## Team Ownership

**Team:** Commerce Team  
**Responsibilities:**
- Product catalog
- Product details
- Product search integration
- Inventory display

## Exposed Components

| Component | Description | Props |
|-----------|-------------|-------|
| `ProductGrid` | Grid of product cards | `onProductClick`, `onAddToCart` |
| `ProductCard` | Single product display | `product`, `onAddToCart` |
| `ProductDetail` | Full product details page | `productId` |

## Development

```bash
npm install
npm run dev  # Port 3004
```

## Exposed via Module Federation

```javascript
exposes: {
  './ProductGrid': './src/components/product-grid',
  './ProductCard': './src/components/product-card',
  './ProductDetail': './src/components/product-detail',
}
```

## Communication

Emits: `product:viewed`, `product:added_to_cart`  
Listens: `search:query`, `filter:applied`
