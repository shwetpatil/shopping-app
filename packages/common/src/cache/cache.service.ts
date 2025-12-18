import RedisClient from './redis.client';
import { logger } from '../logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

export class CacheService {
  private redis = RedisClient.getInstance();
  private defaultTTL = 300; // 5 minutes
  private prefix: string;

  constructor(prefix: string = 'cache') {
    this.prefix = prefix;
  }

  /**
   * Build cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const cachedValue = await this.redis.get(this.buildKey(key));
      
      if (!cachedValue) {
        return null;
      }

      return JSON.parse(cachedValue) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const ttl = options?.ttl || this.defaultTTL;
      const fullKey = this.buildKey(key);
      const serializedValue = JSON.stringify(value);

      await this.redis.setex(fullKey, ttl, serializedValue);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(this.buildKey(key));
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.buildKey(key));
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.buildKey(key));
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Cache-aside pattern: Get from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      logger.debug(`Cache hit for key: ${key}`);
      return cached;
    }

    // Cache miss - fetch data
    logger.debug(`Cache miss for key: ${key}`);
    const data = await fetchFn();

    // Store in cache (don't await to avoid blocking)
    this.set(key, data, options).catch((error) => {
      logger.error(`Failed to cache key ${key}:`, error);
    });

    return data;
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;

    for (const tag of tags) {
      const pattern = `*:${tag}:*`;
      const deleted = await this.delPattern(pattern);
      totalDeleted += deleted;
    }

    return totalDeleted;
  }

  /**
   * Clear all cache with this prefix
   */
  async clear(): Promise<number> {
    return await this.delPattern('*');
  }
}

// Export singleton instances for common use cases
export const productCache = new CacheService('product');
export const cartCache = new CacheService('cart');
export const categoryCache = new CacheService('category');
export const inventoryCache = new CacheService('inventory');
