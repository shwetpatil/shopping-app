# Redis Setup for Local Development

## Installation

### macOS (Homebrew)
```bash
brew install redis
brew services start redis
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
```

### Docker (Recommended for this project)
```bash
# Start Redis container
docker run -d \
  --name shopping-app-redis \
  -p 6379:6379 \
  redis:7-alpine

# Or add to docker-compose.yml:
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

## Environment Variables

Add to each service's `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_ENABLED=true
```

To disable caching (useful for development):
```bash
REDIS_ENABLED=false
```

## Testing Connection

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Monitor Redis commands in real-time
redis-cli monitor

# Check keys
redis-cli keys "*"

# Get a specific key
redis-cli get "product:detail:1"
```

## Verify Caching is Working

1. Start Redis:
   ```bash
   docker start shopping-app-redis
   # OR
   brew services start redis
   ```

2. Start a service (e.g., product-service):
   ```bash
   cd services/product-service
   npm run dev
   ```

3. Check logs for cache messages:
   - First request: "Cache miss for key: ..."
   - Second request: "Cache hit for key: ..."

4. Test via API:
   ```bash
   # First call - cache MISS
   curl http://localhost:4002/api/products/1
   
   # Second call - cache HIT (much faster)
   curl http://localhost:4002/api/products/1
   ```

5. Check response headers:
   ```bash
   curl -I http://localhost:4000/api/v1/products
   # Look for: X-Cache: HIT or X-Cache: MISS
   ```

## Cache Management

### Clear all cache
```bash
redis-cli FLUSHALL
```

### Clear specific service cache
```bash
# Clear product cache
redis-cli --scan --pattern "product:*" | xargs redis-cli DEL

# Clear cart cache
redis-cli --scan --pattern "cart:*" | xargs redis-cli DEL

# Clear category cache
redis-cli --scan --pattern "category:*" | xargs redis-cli DEL
```

### Monitor cache performance
```bash
# Get cache stats
redis-cli INFO stats

# Monitor hit rate
redis-cli INFO stats | grep keyspace
```

## Troubleshooting

### Connection Refused
```bash
# Check if Redis is running
redis-cli ping

# Check port
lsof -i :6379

# Restart Redis
docker restart shopping-app-redis
# OR
brew services restart redis
```

### Out of Memory
```bash
# Check memory usage
redis-cli INFO memory

# Set max memory in redis.conf or docker command
docker run -d \
  --name shopping-app-redis \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Cache not working
1. Check `REDIS_ENABLED` is set to `true`
2. Verify `REDIS_URL` is correct
3. Check service logs for Redis connection errors
4. Test Redis connection: `redis-cli ping`

## Production Considerations

### Redis Configuration
```bash
# Persistence
redis-server --appendonly yes --save 60 1000

# Security
redis-server --requirepass your_strong_password

# Memory
redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### Environment Variables (Production)
```bash
REDIS_URL=redis://:password@redis-host:6379
REDIS_ENABLED=true
REDIS_TTL_PRODUCTS=600      # 10 minutes
REDIS_TTL_CATEGORIES=3600   # 1 hour
REDIS_TTL_CART=1800         # 30 minutes
```

### Monitoring
- Use Redis Insights or RedisInsight for GUI
- Monitor memory usage and eviction rate
- Set up alerts for connection failures
- Track cache hit/miss rates

## Cache Strategy Summary

### Product Service
- **Products List**: 5 min cache
- **Product Detail**: 10 min cache
- **Categories**: 1 hour cache
- **Invalidation**: On create/update/delete

### Cart Service
- **Cart Data**: 30 min cache
- **Invalidation**: On any cart modification

### API Gateway
- **Response Cache**: 5-60 min depending on endpoint
- **Headers**: `X-Cache: HIT/MISS` to track cache usage
