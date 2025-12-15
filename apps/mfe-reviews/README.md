# Reviews Microfrontend

Independently deployable reviews module for the shopping app.

## Team Ownership

**Team:** Engagement Team  
**Responsibilities:**
- Product reviews
- Rating system
- Review moderation
- Review analytics

## Exposed Components

| Component | Description | Props |
|-----------|-------------|-------|
| `ProductReviews` | Complete review section | `productId`, `averageRating`, `totalReviews`, `onSubmitReview` |
| `ReviewForm` | Standalone review form | `productId`, `onSubmit` |

## Development

```bash
npm install
npm run dev  # Port 3003
```

## Exposed via Module Federation

```javascript
exposes: {
  './ProductReviews': './src/components/product-reviews',
  './ReviewForm': './src/components/review-form',
}
```

## Communication

Emits: `review:created`, `review:helpful_marked`  
Listens: `product:viewed`, `order:completed`
