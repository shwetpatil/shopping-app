# CDN Integration Guide

## Overview

This guide explains how to integrate CDN (Content Delivery Network) with the shopping app for optimal performance and global content distribution.

## Supported CDN Providers

### 1. Cloudflare (Recommended for API Gateway)
- **Best for:** API endpoints, dynamic content
- **Features:** Edge caching, DDoS protection, analytics
- **Cost:** Free tier available
- **Config:** [`config/cdn/cloudflare.yml`](../config/cdn/cloudflare.yml)

### 2. AWS CloudFront (Enterprise)
- **Best for:** High traffic, AWS infrastructure
- **Features:** Custom cache behaviors, Lambda@Edge
- **Cost:** Pay per request + data transfer
- **Config:** [`config/cdn/cloudfront.yml`](../config/cdn/cloudfront.yml)

### 3. Vercel Edge Network (Next.js MFEs)
- **Best for:** Next.js frontends
- **Features:** Auto-configured, zero setup
- **Cost:** Free for hobby, paid for production
- **Config:** [`config/cdn/vercel.json`](../config/cdn/vercel.json)

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│   CDN Edge (Closest to User)               │
│   - Cache HIT: Return immediately          │
│   - Cache MISS: Forward to origin          │
└──────┬──────────────────────────────────────┘
       │ (Cache MISS)
       ↓
┌─────────────────────────────────────────────┐
│   Origin Server (Your Infrastructure)      │
│   ├── API Gateway (port 4000)              │
│   ├── Product Service (port 4002)          │
│   └── Other Services                       │
└─────────────────────────────────────────────┘
```

## Cache Strategy by Endpoint

| Endpoint | Browser Cache | CDN Cache | Strategy |
|----------|---------------|-----------|----------|
| `/api/v1/products` | 5 min | 5 min | Fresh for users, CDN reduces load |
| `/api/v1/products/:id` | 10 min | 1 hour | Longer CDN cache, product details change less |
| `/api/v1/categories` | 1 hour | 24 hours | Very long cache, rarely changes |
| `/api/v1/cart` | No cache | No cache | User-specific, always fresh |
| `/api/v1/orders` | No cache | No cache | User-specific, always fresh |
| `/_next/static/*` | 1 year | 1 year | Immutable assets |

## Setup Instructions

### Option 1: Cloudflare (Easiest)

#### 1. Add Your Domain
```bash
# Login to Cloudflare
# Add your domain: api.yourdomain.com
# Update nameservers at your domain registrar
```

#### 2. Configure Page Rules
```yaml
# Rule 1: Cache Products
URL: api.yourdomain.com/api/v1/products*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: Respect Existing Headers
  - Browser Cache TTL: Respect Existing Headers

# Rule 2: Cache Categories  
URL: api.yourdomain.com/api/v1/categories*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: Respect Existing Headers

# Rule 3: Bypass Cart/Orders
URL: api.yourdomain.com/api/v1/{cart,orders}*
Settings:
  - Cache Level: Bypass
```

#### 3. Environment Variables
```bash
# Add to your .env
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token
```

#### 4. Verify
```bash
# Check if CDN is working
curl -I https://api.yourdomain.com/api/v1/products

# Look for these headers:
# cf-cache-status: HIT (or MISS on first request)
# cf-ray: [unique ID]
# age: [seconds cached]
```

### Option 2: AWS CloudFront

#### 1. Deploy Stack
```bash
# Using AWS CLI
aws cloudformation create-stack \
  --stack-name shopping-app-cdn \
  --template-body file://config/cdn/cloudfront.yml \
  --parameters \
    ParameterKey=DomainName,ParameterValue=api.yourdomain.com

# Or using Terraform
cd config/cdn
terraform init
terraform apply
```

#### 2. Update DNS
```bash
# Point your domain to CloudFront distribution
# CNAME: api.yourdomain.com -> d111111abcdef8.cloudfront.net
```

#### 3. Environment Variables
```bash
# Add to your .env
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC
AWS_REGION=us-east-1
```

#### 4. Verify
```bash
curl -I https://api.yourdomain.com/api/v1/products

# Look for:
# x-cache: Hit from cloudfront
# x-amz-cf-id: [unique ID]
# age: [seconds cached]
```

### Option 3: Vercel (Next.js MFEs)

#### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy each MFE
cd apps/mfe-products
vercel deploy --prod
```

#### 2. Custom Configuration
```bash
# Copy vercel.json to each MFE root
cp config/cdn/vercel.json apps/mfe-products/
cp config/cdn/vercel.json apps/mfe-cart/
# ... repeat for all MFEs
```

#### 3. Environment Variables
```bash
# In Vercel Dashboard, set:
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### 4. Verify
```bash
curl -I https://mfe-products.vercel.app/_next/static/...

# Look for:
# x-vercel-cache: HIT
# cache-control: public, max-age=31536000, immutable
```

## Cache Headers Explained

### Current Implementation

Your services now send these headers:

```http
# Products List
Cache-Control: public, max-age=300, s-maxage=300
```
- `public`: Can be cached by CDN
- `max-age=300`: Browser caches for 5 minutes
- `s-maxage=300`: CDN caches for 5 minutes

```http
# Product Detail
Cache-Control: public, max-age=600, s-maxage=3600
```
- Browser: 10 minutes
- CDN: 1 hour (reduces backend load)

```http
# Categories
Cache-Control: public, max-age=3600, s-maxage=86400
```
- Browser: 1 hour
- CDN: 24 hours (categories rarely change)

```http
# Cart (no cache)
Cache-Control: private, no-cache
```
- Not cached anywhere

## Cache Invalidation

### Automatic Invalidation (Recommended)

Update your product/category services to purge CDN cache on updates:

```typescript
// After updating a product
await productRepository.update(id, data);

// Purge CDN cache
if (process.env.CDN_PURGE_ENABLED === 'true') {
  await fetch(`${process.env.CDN_PURGE_URL}/api/v1/products/${id}`, {
    method: 'DELETE',
  });
}
```

### Manual Invalidation

Use the provided script:

```bash
# Purge all caches
./scripts/purge-cdn-cache.sh all

# Purge Cloudflare only
./scripts/purge-cdn-cache.sh cloudflare

# Purge specific pattern
./scripts/purge-cdn-cache.sh cloudflare "/api/v1/products/*"
```

### API-Based Purge

```bash
# Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://api.yourdomain.com/api/v1/products"]}'

# AWS CloudFront
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/api/v1/products/*"
```

## Monitoring & Analytics

### Check Cache Performance

```bash
# Cloudflare Analytics
curl "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/analytics/dashboard" \
  -H "Authorization: Bearer ${API_TOKEN}"

# Look for:
# - Cache hit rate (aim for >80%)
# - Bandwidth saved
# - Response time improvement
```

### Headers to Monitor

```bash
# Check if CDN is working
curl -I https://api.yourdomain.com/api/v1/products | grep -i cache

# Should see:
# X-Cache: HIT (or MISS on first request)
# Age: 45 (seconds since cached)
# Cache-Control: public, max-age=300, s-maxage=300
```

### Performance Metrics

Target metrics with CDN:
- **Cache Hit Rate:** >80%
- **Response Time:** <50ms (cache hit)
- **Bandwidth Saved:** >60%
- **Origin Load:** -70% requests

## Troubleshooting

### Cache Not Working

```bash
# 1. Check headers are being sent
curl -I http://localhost:4000/api/v1/products
# Should see: Cache-Control: public, max-age=...

# 2. Check CDN configuration
# Cloudflare: Ensure "Cache Level" is not "Bypass"
# CloudFront: Check cache policy is attached

# 3. Check for cache-busting params
# Remove: ?v=123, ?t=timestamp from URLs
```

### Stale Data After Update

```bash
# Option 1: Purge cache
./scripts/purge-cdn-cache.sh all

# Option 2: Wait for TTL to expire
# Check TTL: curl -I https://... | grep age

# Option 3: Add cache versioning
# GET /api/v1/products?v=2
```

### High Origin Load

```bash
# Check cache hit rate
# Cloudflare: Dashboard > Analytics > Caching
# Should be >70%

# If low, increase s-maxage:
# Change: s-maxage=300 → s-maxage=3600

# Warm up cache after purge:
./scripts/warm-cdn-cache.sh
```

## Cost Optimization

### Cloudflare
- **Free:** Up to unlimited requests (with limits)
- **Pro ($20/mo):** Better analytics, image optimization
- **Business ($200/mo):** 100% uptime SLA

### AWS CloudFront
- **Cost:** $0.085/GB (first 10TB)
- **Requests:** $0.0075 per 10,000 requests
- **Tip:** Use CloudFront + S3 for cheaper static hosting

### Vercel
- **Hobby:** Free for personal projects
- **Pro ($20/mo):** Production apps, better limits
- **Enterprise:** Custom pricing

## Best Practices

1. **Always set Cache-Control headers** (✅ Done)
2. **Use different TTLs for different content types** (✅ Done)
3. **Invalidate cache on content updates** (TODO: Automate)
4. **Monitor cache hit rate** (Set up alerts)
5. **Test cache behavior in staging first**
6. **Use versioned URLs for immutable assets**
7. **Set up cache warming for critical pages**
8. **Document cache invalidation procedures**

## Next Steps

- [ ] Choose a CDN provider (Cloudflare recommended)
- [ ] Configure DNS to point to CDN
- [ ] Deploy and verify cache headers
- [ ] Set up automated cache purging
- [ ] Monitor cache performance
- [ ] Optimize TTLs based on hit rate
- [ ] Add cache warming script

## References

- [Cloudflare Caching Docs](https://developers.cloudflare.com/cache/)
- [AWS CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)
- [HTTP Caching RFC](https://httpwg.org/specs/rfc9111.html)
