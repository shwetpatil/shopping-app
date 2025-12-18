import { Request, Response, NextFunction } from 'express';
import { logger } from '@shopping-app/common';
import { CacheService } from '@shopping-app/common';

const responseCache = new CacheService('response');

export interface ResponseCacheOptions {
  ttl?: number;
  /**
   * Function to generate cache key from request
   * Default: method + url + query params
   */
  keyGenerator?: (req: Request) => string;
  /**
   * Should this request be cached?
   */
  shouldCache?: (req: Request) => boolean;
}

/**
 * Default cache key generator
 */
const defaultKeyGenerator = (req: Request): string => {
  const query = JSON.stringify(req.query);
  return `${req.method}:${req.path}:${query}`;
};

/**
 * Default cache check - only cache GET requests
 */
const defaultShouldCache = (req: Request): boolean => {
  return req.method === 'GET';
};

/**
 * Response caching middleware for API Gateway
 * Caches successful responses (200-299) for GET requests
 */
export const responseCacheMiddleware = (options: ResponseCacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = defaultKeyGenerator,
    shouldCache = defaultShouldCache,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if caching not applicable
    if (!shouldCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Try to get from cache
      const cachedResponse = await responseCache.get<{
        status: number;
        headers: Record<string, string>;
        body: any;
      }>(cacheKey);

      if (cachedResponse) {
        logger.debug(`Response cache hit: ${cacheKey}`);
        
        // Set headers
        Object.entries(cachedResponse.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        // Add cache hit header
        res.setHeader('X-Cache', 'HIT');
        
        // Send cached response
        return res.status(cachedResponse.status).json(cachedResponse.body);
      }

      logger.debug(`Response cache miss: ${cacheKey}`);

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = function (body: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const headers: Record<string, string> = {};
          
          // Store relevant headers
          ['content-type', 'cache-control'].forEach((header) => {
            const value = res.getHeader(header);
            if (value) {
              headers[header] = String(value);
            }
          });

          // Cache the response asynchronously
          responseCache.set(
            cacheKey,
            {
              status: res.statusCode,
              headers,
              body,
            },
            { ttl }
          ).catch((error) => {
            logger.error(`Failed to cache response for ${cacheKey}:`, error);
          });
        }

        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      res.send = function (body: any) {
        res.setHeader('X-Cache', 'MISS');
        return originalSend(body);
      };

      next();
    } catch (error) {
      logger.error('Response cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate response cache for specific paths
 */
export const invalidateResponseCache = async (patterns: string[]): Promise<void> => {
  for (const pattern of patterns) {
    await responseCache.delPattern(`GET:${pattern}*`);
    logger.debug(`Invalidated response cache for pattern: ${pattern}`);
  }
};
