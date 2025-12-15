/**
 * Rate Limiting Utility
 * Client-side rate limiting to prevent API abuse
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (endpoint: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private config: RateLimitConfig;
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (endpoint) => endpoint,
      ...config,
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Check if request is allowed
   */
  isAllowed(endpoint: string): boolean {
    const key = this.config.keyGenerator!(endpoint);
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetAt) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return true;
    }

    if (entry.count < this.config.maxRequests) {
      // Within limit
      entry.count++;
      return true;
    }

    // Rate limit exceeded
    return false;
  }

  /**
   * Get time until reset for endpoint
   */
  getTimeUntilReset(endpoint: string): number {
    const key = this.config.keyGenerator!(endpoint);
    const entry = this.limits.get(key);
    
    if (!entry) return 0;
    
    return Math.max(0, entry.resetAt - Date.now());
  }

  /**
   * Get remaining requests for endpoint
   */
  getRemainingRequests(endpoint: string): number {
    const key = this.config.keyGenerator!(endpoint);
    const entry = this.limits.get(key);
    
    if (!entry) return this.config.maxRequests;
    
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Reset rate limit for endpoint
   */
  reset(endpoint: string): void {
    const key = this.config.keyGenerator!(endpoint);
    this.limits.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.limits.clear();
  }

  /**
   * Destroy rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}

/**
 * Create rate limiter instance
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Token bucket rate limiter (more flexible)
 */
export interface TokenBucketConfig {
  capacity: number;
  refillRate: number; // tokens per second
  refillInterval?: number; // ms between refills
}

class TokenBucket {
  private config: TokenBucketConfig;
  private tokens: number;
  private lastRefill: number;
  private refillInterval: NodeJS.Timeout | null = null;

  constructor(config: TokenBucketConfig) {
    this.config = {
      refillInterval: 1000,
      ...config,
    };
    this.tokens = config.capacity;
    this.lastRefill = Date.now();

    // Start refill interval
    this.refillInterval = setInterval(() => this.refill(), this.config.refillInterval);
  }

  /**
   * Refill tokens
   */
  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.config.refillRate;
    
    this.tokens = Math.min(this.config.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Try to consume tokens
   */
  consume(tokens: number = 1): boolean {
    this.refill(); // Ensure tokens are up to date

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Get available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  /**
   * Reset bucket
   */
  reset(): void {
    this.tokens = this.config.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Destroy token bucket
   */
  destroy(): void {
    if (this.refillInterval) {
      clearInterval(this.refillInterval);
      this.refillInterval = null;
    }
  }
}

/**
 * Create token bucket instance
 */
export function createTokenBucket(config: TokenBucketConfig): TokenBucket {
  return new TokenBucket(config);
}

// Export classes
export { RateLimiter, TokenBucket };
