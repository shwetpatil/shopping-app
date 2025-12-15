import {
  createAnalytics,
  createGoogleAnalyticsProvider,
  createConsoleProvider,
  createAPIProvider,
} from '../analytics/tracking';

describe('Analytics', () => {
  describe('createAnalytics', () => {
    it('should create analytics manager', () => {
      const analytics = createAnalytics([]);
      expect(analytics).toBeDefined();
      expect(analytics.track).toBeDefined();
      expect(analytics.identify).toBeDefined();
      expect(analytics.page).toBeDefined();
    });

    it('should track events to all providers', () => {
      const provider1 = {
        name: 'provider1',
        track: jest.fn(),
        identify: jest.fn(),
        page: jest.fn(),
      };

      const provider2 = {
        name: 'provider2',
        track: jest.fn(),
        identify: jest.fn(),
        page: jest.fn(),
      };

      const analytics = createAnalytics([provider1, provider2]);
      analytics.track('test_event', { value: 123 });

      expect(provider1.track).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({ value: 123 })
      );
      expect(provider2.track).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({ value: 123 })
      );
    });

    it('should enrich events with metadata', () => {
      const provider = {
        name: 'test',
        track: jest.fn(),
        identify: jest.fn(),
        page: jest.fn(),
      };

      const analytics = createAnalytics([provider], {
        mfeName: 'test-mfe',
      });

      analytics.track('test_event', { custom: 'data' });

      expect(provider.track).toHaveBeenCalledWith(
        'test_event',
        expect.objectContaining({
          custom: 'data',
          mfeName: 'test-mfe',
          timestamp: expect.any(Number),
          sessionId: expect.any(String),
        })
      );
    });

    it('should identify users', () => {
      const provider = {
        name: 'test',
        track: jest.fn(),
        identify: jest.fn(),
        page: jest.fn(),
      };

      const analytics = createAnalytics([provider]);
      analytics.identify('user-123', { name: 'Test User', email: 'test@example.com' });

      expect(provider.identify).toHaveBeenCalledWith(
        'user-123',
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
        })
      );
    });

    it('should track page views', () => {
      const provider = {
        name: 'test',
        track: jest.fn(),
        identify: jest.fn(),
        page: jest.fn(),
      };

      const analytics = createAnalytics([provider]);
      analytics.page('/products', 'Products Page', { category: 'shopping' });

      expect(provider.page).toHaveBeenCalledWith(
        '/products',
        'Products Page',
        expect.objectContaining({
          category: 'shopping',
        })
      );
    });

    it('should handle provider errors gracefully', () => {
      const failingProvider = {
        name: 'failing',
        track: jest.fn().mockImplementation(() => {
          throw new Error('Provider error');
        }),
        identify: jest.fn(),
        page: jest.fn(),
      };

      const analytics = createAnalytics([failingProvider]);

      expect(() => {
        analytics.track('test_event');
      }).not.toThrow();
    });
  });

  describe('createGoogleAnalyticsProvider', () => {
    it('should create GA provider', () => {
      const provider = createGoogleAnalyticsProvider('GA-12345');
      expect(provider.name).toBe('google-analytics');
    });

    it('should track events to gtag', () => {
      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      const provider = createGoogleAnalyticsProvider('GA-12345');
      provider.track('purchase', { value: 99.99, currency: 'USD' });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'purchase',
        expect.objectContaining({
          value: 99.99,
          currency: 'USD',
        })
      );
    });

    it('should handle missing gtag gracefully', () => {
      (window as any).gtag = undefined;

      const provider = createGoogleAnalyticsProvider('GA-12345');

      expect(() => {
        provider.track('test_event');
      }).not.toThrow();
    });
  });

  describe('createConsoleProvider', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should create console provider', () => {
      const provider = createConsoleProvider();
      expect(provider.name).toBe('console');
    });

    it('should log events to console', () => {
      const provider = createConsoleProvider();
      provider.track('test_event', { data: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Track:',
        'test_event',
        expect.objectContaining({ data: 'test' })
      );
    });

    it('should log identify calls', () => {
      const provider = createConsoleProvider();
      provider.identify('user-123', { name: 'Test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Identify:',
        'user-123',
        expect.objectContaining({ name: 'Test' })
      );
    });
  });

  describe('createAPIProvider', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should create API provider', () => {
      const provider = createAPIProvider('https://analytics.example.com');
      expect(provider.name).toBe('api');
    });

    it('should send events to API endpoint', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });
      global.fetch = mockFetch;

      const provider = createAPIProvider('https://analytics.example.com');
      await provider.track('test_event', { data: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://analytics.example.com/track',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('test_event'),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const provider = createAPIProvider('https://analytics.example.com');

      await expect(
        provider.track('test_event')
      ).resolves.not.toThrow();
    });
  });
});
