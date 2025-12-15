# Cart & Checkout Microfrontend

Independently deployable cart and checkout module for the shopping app.

## Team Ownership

**Team:** Commerce Team  
**Responsibilities:**
- Shopping cart management
- Checkout flow
- Order placement
- Payment processing integration

## Exposed Components

| Component | Description | Props |
|-----------|-------------|-------|
| `CartSummary` | Cart items and totals | `onUpdateQuantity`, `onRemoveItem`, `onCheckout` |
| `CheckoutFlow` | Multi-step checkout | `onComplete` |
| `CartPage` | Full cart management page | - |

## Development

```bash
npm install
npm run dev  # Port 3005
```

## Exposed via Module Federation

```javascript
exposes: {
  './CartSummary': './src/components/cart-summary',
  './CheckoutFlow': './src/components/checkout-flow',
  './CartPage': './src/app/cart/page',
}
```

## Communication

Emits: `cart:item_added`, `cart:checkout_started`, `order:placed`  
Listens: `auth:logged_in`, `product:added_to_cart`
