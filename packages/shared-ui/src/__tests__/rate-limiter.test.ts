import { createRateLimiter, createTokenBucket } from '../utils/rate-limiter';

describe('Rate Limiter', () => {
  describe('Fixed Window Rate Limiter', () => {
    it('should allow requests within limit', () => {
      const limiter = createRateLimiter({
        maxRequests: 3,
        windowMs: 1000,
      });

      expect(limiter.isAllowed('/api/test')).toBe(true);
      expect(limiter.isAllowed('/api/test')).toBe(true);
      expect(limiter.isAllowed('/api/test')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      expect(limiter.isAllowed('/api/test')).toBe(true);
      expect(limiter.isAllowed('/api/test')).toBe(true);
      expect(limiter.isAllowed('/api/test')).toBe(false);
    });

    it('should track remaining requests', () => {
      const limiter = createRateLimiter({
        maxRequests: 5,
        windowMs: 1000,
      });

      expect(limiter.getRemainingRequests('/api/test')).toBe(5);
      limiter.isAllowed('/api/test');
      expect(limiter.getRemainingRequests('/api/test')).toBe(4);
    });

    it('should reset after window expires', () => {
      jest.useFakeTimers();

      const limiter = createRateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      limiter.isAllowed('/api/test');
      limiter.isAllowed('/api/test');
      expect(limiter.isAllowed('/api/test')).toBe(false);

      jest.advanceTimersByTime(1001);
      expect(limiter.isAllowed('/api/test')).toBe(true);

      jest.useRealTimers();
    });

    it('should track different endpoints separately', () => {
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
      });

      expect(limiter.isAllowed('/api/endpoint1')).toBe(true);
      expect(limiter.isAllowed('/api/endpoint2')).toBe(true);
      expect(limiter.isAllowed('/api/endpoint1')).toBe(false);
    });

    it('should support custom key generator', () => {
      const limiter = createRateLimiter({
        maxRequests: 1,
        windowMs: 1000,
        keyGenerator: () => 'global',
      });

      limiter.isAllowed('/api/endpoint1');
      expect(limiter.isAllowed('/api/endpoint2')).toBe(false);
    });
  });

  describe('Token Bucket', () => {
    it('should allow consuming tokens', () => {
      const bucket = createTokenBucket({
        capacity: 10,
        refillRate: 1,
      });

      expect(bucket.consume(5)).toBe(true);
      expect(bucket.getAvailableTokens()).toBe(5);
    });

    it('should block when insufficient tokens', () => {
      const bucket = createTokenBucket({
        capacity: 5,
        refillRate: 1,
      });

      expect(bucket.consume(3)).toBe(true);
      expect(bucket.consume(3)).toBe(false);
    });

    it('should refill tokens over time', () => {
      jest.useFakeTimers();

      const bucket = createTokenBucket({
        capacity: 10,
        refillRate: 2, // 2 tokens per second
        refillInterval: 1000,
      });

      bucket.consume(10);
      expect(bucket.getAvailableTokens()).toBe(0);

      jest.advanceTimersByTime(1000);
      expect(bucket.getAvailableTokens()).toBeGreaterThan(0);

      jest.useRealTimers();
    });

    it('should not exceed capacity', () => {
      jest.useFakeTimers();

      const bucket = createTokenBucket({
        capacity: 5,
        refillRate: 10,
        refillInterval: 1000,
      });

      jest.advanceTimersByTime(5000);
      expect(bucket.getAvailableTokens()).toBe(5);

      jest.useRealTimers();
    });
  });
});
