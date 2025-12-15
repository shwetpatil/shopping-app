# API Testing Guide

This guide shows how to test the complete flow of the shopping application through the API Gateway.

## Base URL

All requests go through the API Gateway:
```
http://localhost:3000
```

## 1. User Registration & Authentication

### Register a New User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Save the `accessToken` for subsequent requests!**

## 2. Product Management

### Get All Products

```bash
curl http://localhost:3000/api/v1/products
```

### Create a Product (Admin)

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "iPhone 15 Pro",
    "slug": "iphone-15-pro",
    "description": "Latest iPhone with A17 Pro chip",
    "price": 999.99,
    "sku": "IPHONE-15-PRO-001",
    "isActive": true,
    "isFeatured": true,
    "images": [
      {
        "url": "https://example.com/iphone.jpg",
        "altText": "iPhone 15 Pro",
        "position": 0
      }
    ]
  }'
```

### Get Product by ID

```bash
curl http://localhost:3000/api/v1/products/{PRODUCT_ID}
```

### Create Category

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and accessories"
  }'
```

### Create Brand

```bash
curl -X POST http://localhost:3000/api/v1/brands \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Apple",
    "slug": "apple",
    "logoUrl": "https://example.com/apple-logo.png"
  }'
```

## 3. Order Management

### Create an Order

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_UUID_HERE",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "fullName": "John Doe",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "USA",
      "phone": "+1234567890"
    },
    "shippingCost": 10.00,
    "notes": "Please handle with care"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD24121400001",
    "status": "PENDING",
    "totalAmount": "1109.98",
    "items": [...]
  },
  "message": "Order created successfully"
}
```

### Get My Orders

```bash
curl http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Order by ID

```bash
curl http://localhost:3000/api/v1/orders/{ORDER_ID} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Order Status (Admin)

```bash
curl -X PATCH http://localhost:3000/api/v1/orders/{ORDER_ID}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "PROCESSING",
    "notes": "Order is being prepared"
  }'
```

**Valid Status Transitions:**
- `PENDING` → `PAYMENT_PENDING`, `CANCELLED`, `FAILED`
- `PAYMENT_PENDING` → `PAID`, `FAILED`, `CANCELLED`
- `PAID` → `PROCESSING`, `REFUNDED`
- `PROCESSING` → `SHIPPED`, `CANCELLED`
- `SHIPPED` → `DELIVERED`
- `DELIVERED` → `REFUNDED`

### Cancel Order

```bash
curl -X DELETE http://localhost:3000/api/v1/orders/{ORDER_ID} \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 4. BFF (Backend for Frontend) Endpoints

These endpoints aggregate data from multiple services:

### Get Home Page Data

```bash
curl http://localhost:3000/api/v1/bff/home
```

**Returns:**
- Featured products
- Top categories
- Popular brands

### Get Product Details with Related Products

```bash
curl http://localhost:3000/api/v1/bff/product/{PRODUCT_ID}
```

**Returns:**
- Full product details
- Related products from same category

### Get User Dashboard

```bash
curl http://localhost:3000/api/v1/bff/user/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Returns:**
- Recent orders
- Product recommendations
- User statistics

## 5. Token Refresh

When your access token expires (15 minutes):

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 6. Logout

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Complete Flow Example

### 1. Register & Login

```bash
# Register
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }')

# Extract token
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.accessToken')
echo "Access Token: $ACCESS_TOKEN"
```

### 2. Create a Product

```bash
PRODUCT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "MacBook Pro",
    "slug": "macbook-pro",
    "description": "16-inch MacBook Pro",
    "price": 2499.99,
    "sku": "MBP-16-001"
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data.id')
echo "Product ID: $PRODUCT_ID"
```

### 3. Create an Order

```bash
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"items\": [{
      \"productId\": \"$PRODUCT_ID\",
      \"quantity\": 1
    }],
    \"shippingAddress\": {
      \"fullName\": \"Test User\",
      \"address\": \"123 Test St\",
      \"city\": \"Test City\",
      \"state\": \"CA\",
      \"postalCode\": \"12345\",
      \"country\": \"USA\",
      \"phone\": \"+1234567890\"
    }
  }")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')
echo "Order ID: $ORDER_ID"
```

### 4. Check Order Status

```bash
curl -s http://localhost:3000/api/v1/orders/$ORDER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq
```

## Testing Kafka Events

When you create an order, check the Kafka UI to see the events:

1. Open http://localhost:8080
2. Navigate to Topics
3. Look for `order.placed` topic
4. View messages to see the event payload

## Health Checks

Check all services are running:

```bash
# API Gateway
curl http://localhost:3000/health

# Auth Service
curl http://localhost:3001/health

# Product Service
curl http://localhost:3002/health

# Order Service
curl http://localhost:3003/health
```

## Error Handling

All errors follow this format:

```json
{
  "errors": [
    {
      "message": "Error message here",
      "field": "fieldName" // optional
    }
  ]
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Pagination

List endpoints support pagination:

```bash
curl "http://localhost:3000/api/v1/products?page=1&limit=10"
```

**Response includes:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

## Filtering & Search

Products support filtering:

```bash
# Search
curl "http://localhost:3000/api/v1/products?search=iphone"

# Filter by category
curl "http://localhost:3000/api/v1/products?categoryId=CATEGORY_UUID"

# Filter by brand
curl "http://localhost:3000/api/v1/products?brandId=BRAND_UUID"

# Active products only
curl "http://localhost:3000/api/v1/products?isActive=true"
```

## Rate Limiting

The API Gateway has rate limiting:
- **500 requests per 15 minutes** per IP address
- When exceeded, you'll get a `429 Too Many Requests` response

## CORS

The API supports CORS for frontend applications. Configure allowed origins in the gateway's `.env` file.
