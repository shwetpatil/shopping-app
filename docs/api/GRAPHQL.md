# GraphQL API

The API Gateway now includes a GraphQL endpoint that aggregates data from multiple microservices.

## Endpoint

```
POST /graphql
```

GraphQL Playground (Development only): `http://localhost:3000/graphql`

## Features

- ✅ Single endpoint for all data fetching
- ✅ Fetch only the fields you need
- ✅ Aggregate data from multiple services in one query
- ✅ Strongly typed schema
- ✅ Authentication support via context

## Example Queries

### Get Product with Related Data

```graphql
query GetProduct($id: ID!) {
  product(id: $id) {
    id
    name
    price
    description
    category {
      name
      slug
    }
    brand {
      name
      logoUrl
    }
    images {
      url
      altText
    }
    inventory {
      stockLevel
      availableStock
      status
    }
  }
}
```

### Get Products with Filtering

```graphql
query GetProducts($filters: ProductFilters) {
  products(filters: $filters) {
    data {
      id
      name
      price
      images {
        url
      }
      brand {
        name
      }
    }
    pagination {
      page
      limit
      total
      totalPages
    }
  }
}

# Variables
{
  "filters": {
    "categoryId": 1,
    "minPrice": 100,
    "maxPrice": 1000,
    "page": 1,
    "limit": 10
  }
}
```

### Aggregated Product Detail (Multiple Services)

This query fetches data from Product, Inventory, and Cart services in one request:

```graphql
query ProductDetailPage($id: ID!) {
  productDetail(id: $id) {
    product {
      id
      name
      price
      description
      images {
        url
      }
      category {
        name
      }
      brand {
        name
        logoUrl
      }
    }
    inventory {
      stockLevel
      availableStock
      status
    }
    inCart
    cartQuantity
    relatedProducts {
      id
      name
      price
      images {
        url
      }
    }
  }
}
```

### Get My Cart (Requires Auth)

```graphql
query MyCart {
  myCart {
    id
    items {
      id
      quantity
      price
      product {
        name
        images {
          url
        }
      }
    }
    subtotal
    total
  }
}
```

### Get My Orders (Requires Auth)

```graphql
query MyOrders {
  myOrders {
    id
    status
    total
    createdAt
    items {
      quantity
      price
      product {
        name
        images {
          url
        }
      }
    }
  }
}
```

## Example Mutations

### Add to Cart

```graphql
mutation AddToCart($input: AddToCartInput!) {
  addToCart(input: $input) {
    id
    items {
      id
      productId
      quantity
      price
    }
    total
  }
}

# Variables
{
  "input": {
    "productId": 1,
    "quantity": 2
  }
}
```

### Update Cart Item

```graphql
mutation UpdateCartItem($itemId: ID!, $quantity: Int!) {
  updateCartItem(itemId: $itemId, quantity: $quantity) {
    id
    items {
      id
      quantity
    }
    total
  }
}
```

## Authentication

For queries/mutations that require authentication, include the JWT token in the Authorization header:

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query":"{ myCart { id total } }"}'
```

## Benefits Over REST

### Before (REST - Multiple Requests)
```javascript
// Product page needs 4 API calls
const product = await fetch('/api/v1/products/123')
const inventory = await fetch('/api/v1/inventory/123')
const cart = await fetch('/api/v1/cart')
const related = await fetch('/api/v1/products?categoryId=5&limit=4')
```

### After (GraphQL - One Request)
```javascript
const { data } = await fetch('/graphql', {
  method: 'POST',
  body: JSON.stringify({
    query: `
      query ProductPage($id: ID!) {
        productDetail(id: $id) {
          product { name price }
          inventory { stock }
          inCart
          relatedProducts { name price }
        }
      }
    `,
    variables: { id: '123' }
  })
})
```

## Schema Documentation

Visit `http://localhost:3000/graphql` in development to explore the full schema with auto-complete and documentation.

## Architecture

```
Frontend
    ↓
GraphQL Gateway (API Gateway)
    ↓
┌───┴───┬────────┬─────────┐
│       │        │         │
Product Cart  Inventory  Order
Service Service Service  Service
```

The GraphQL layer aggregates data from REST microservices, giving you the best of both worlds:
- **GraphQL** for frontend flexibility
- **REST** for internal service communication
