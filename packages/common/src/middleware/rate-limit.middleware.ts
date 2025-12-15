import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { TooManyRequestsError } from '../errors';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Default configurations for different rate limit tiers
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  // Standard API limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  },
  // Generous limits for reading data
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
  },
  // Strict limits for write operations
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
};

export class RateLimiter {
  private redis: Redis;

  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Creates a rate limiting middleware
   */
  createMiddleware(config: RateLimitConfig) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Use IP address or user ID as identifier
        const identifier = req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
        const key = `rate-limit:${req.path}:${identifier}`;

        // Get current request count
        const current = await this.redis.get(key);
        const requestCount = current ? parseInt(current) : 0;

        // Check if limit exceeded
        if (requestCount >= config.maxRequests) {
          const ttl = await this.redis.ttl(key);
          
          res.set({
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + ttl * 1000).toISOString(),
            'Retry-After': ttl.toString(),
          });

          throw new TooManyRequestsError(
            `Too many requests. Please try again in ${Math.ceil(ttl / 60)} minutes.`
          );
        }

        // Increment counter
        const multi = this.redis.multi();
        multi.incr(key);
        
        if (requestCount === 0) {
          // Set expiration on first request
          multi.pexpire(key, config.windowMs);
        }
        
        await multi.exec();

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': (config.maxRequests - requestCount - 1).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString(),
        });

        next();
      } catch (error) {
        if (error instanceof TooManyRequestsError) {
          throw error;
        }
        // If Redis fails, allow the request but log the error
        console.error('Rate limiter error:', error);
        next();
      }
    };
  }

  /**
   * Reset rate limit for a specific identifier and path
   */
  async reset(path: string, identifier: string): Promise<void> {
    const key = `rate-limit:${path}:${identifier}`;
    await this.redis.del(key);
  }

  /**
   * Get current rate limit status
   */
  async getStatus(path: string, identifier: string): Promise<{ count: number; ttl: number }> {
    const key = `rate-limit:${path}:${identifier}`;
    const [count, ttl] = await Promise.all([
      this.redis.get(key),
      this.redis.ttl(key),
    ]);

    return {
      count: count ? parseInt(count) : 0,
      ttl: ttl || 0,
    };
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export const getRateLimiter = (): RateLimiter => {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
};

// Convenience middleware exports
export const authRateLimit = () => {
  const limiter = getRateLimiter();
  return limiter.createMiddleware(RATE_LIMIT_CONFIGS.auth);
};

export const apiRateLimit = () => {
  const limiter = getRateLimiter();
  return limiter.createMiddleware(RATE_LIMIT_CONFIGS.api);
};

export const readRateLimit = () => {
  const limiter = getRateLimiter();
  return limiter.createMiddleware(RATE_LIMIT_CONFIGS.read);
};

export const writeRateLimit = () => {
  const limiter = getRateLimiter();
  return limiter.createMiddleware(RATE_LIMIT_CONFIGS.write);
};
