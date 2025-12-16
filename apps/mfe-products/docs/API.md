# Products MFE - API Documentation

## Overview

The Products MFE communicates with the Product Service (port 3001) for all product-related data.

## Base URL

```
Development: http://localhost:3001
Production: https://api.shopping-app.com
```

## Authentication

Currently no authentication required. Will be added in future releases.

## Endpoints

### List Products

Retrieve a list of products with optional filtering.

**Endpoint:** `GET /api/products`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter by category (e.g., 'electronics') |
| `search` | string | No | Search in product name and description |
| `limit` | number | No | Number of products per page (default: 20) |
| `offset` | number | No | Pagination offset (default: 0) |

**Example Request:**

```bash
curl "http://localhost:3001/api/products?category=electronics&limit=10"
```

**Success Response:** `200 OK`

```json
[
  {
    "id": "prod-001",
    "name": "Wireless Headphones",
    "price": 79.99,
    "imageUrl": "https://example.com/image.jpg",
    "rating": 4.5,
    "reviewCount": 128,
    "description": "Premium wireless headphones",
    "stock": 45,
    "category": "electronics"
  }
]
```

**Error Response:** `500 Internal Server Error`

```json
{
  "error": "Internal server error",
  "message": "Failed to fetch products"
}
```

---

### Get Product by ID

Retrieve detailed information for a specific product.

**Endpoint:** `GET /api/products/:id`

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Product ID |

**Example Request:**

```bash
curl "http://localhost:3001/api/products/prod-001"
```

**Success Response:** `200 OK`

```json
{
  "id": "prod-001",
  "name": "Wireless Headphones",
  "price": 79.99,
  "imageUrl": "https://example.com/image.jpg",
  "rating": 4.5,
  "reviewCount": 128,
  "description": "Premium wireless over-ear headphones with noise cancellation",
  "stock": 45,
  "category": "electronics",
  "specifications": {
    "battery": "30 hours",
    "connectivity": "Bluetooth 5.0",
    "weight": "250g"
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-12-01T15:30:00Z"
}
```

**Error Responses:**

`404 Not Found`
```json
{
  "error": "Not found",
  "message": "Product not found"
}
```

`500 Internal Server Error`
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch product"
}
```

---

## Data Types

### Product

```typescript
interface Product {
  id: string;                  // Unique identifier
  name: string;                // Product name
  price: number;               // Price in USD
  imageUrl?: string;           // Product image URL
  rating?: number;             // Average rating (0-5)
  reviewCount?: number;        // Number of reviews
  description?: string;        // Product description
  stock?: number;              // Available quantity
  category?: string;           // Product category
  specifications?: Record<string, string>; // Key-value specs
  createdAt?: string;          // ISO 8601 timestamp
  updatedAt?: string;          // ISO 8601 timestamp
}
```

## Error Handling

All endpoints follow a consistent error response format:

```typescript
interface ErrorResponse {
  error: string;      // Error type
  message: string;    // Human-readable message
  details?: unknown;  // Additional error details
}
```

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Rate Limiting

Currently no rate limiting. Will be implemented in production.

**Planned limits:**
- Anonymous: 100 requests/minute
- Authenticated: 1000 requests/minute

## Caching

### Client-Side Caching

React Query handles client-side caching:
- **Stale Time:** 5 minutes
- **Cache Time:** 10 minutes
- **Automatic refetch:** On window focus

### Server-Side Caching

Product Service implements caching:
- **Cache Duration:** 15 minutes
- **Cache Invalidation:** On product updates

## Usage Examples

### Fetch All Products

```typescript
import { fetchProducts } from '@/lib/api';

const products = await fetchProducts();
```

### Fetch with Filters

```typescript
const electronics = await fetchProducts({
  category: 'electronics',
  limit: 20,
  offset: 0
});
```

### Search Products

```typescript
const results = await fetchProducts({
  search: 'wireless headphones',
  limit: 10
});
```

### Fetch Single Product

```typescript
import { fetchProductById } from '@/lib/api';

const product = await fetchProductById('prod-001');
```

### With React Query

```typescript
import { useProducts, useProduct } from '@/hooks/use-product-queries';

// List products
const { data: products, isLoading, error } = useProducts({
  category: 'electronics'
});

// Single product
const { data: product } = useProduct('prod-001');
```

## Mock Data

For development without backend, enable mock data:

```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
```

Mock data is located in: `src/__tests__/fixtures/products.fixture.ts`

## Future Enhancements

- [ ] Authentication with JWT
- [ ] Rate limiting
- [ ] GraphQL endpoint
- [ ] WebSocket for real-time updates
- [ ] Bulk operations
- [ ] Advanced filtering (price range, ratings)
- [ ] Sorting options
- [ ] Pagination metadata

## Support

For API issues or questions:
- **Slack:** #team-commerce
- **Email:** commerce-team@company.com
- **Docs:** [Internal Wiki](https://wiki.company.com/products-api)
