import {
  performHealthCheck,
  createAPIHealthCheck,
  createMemoryHealthCheck,
  createStorageHealthCheck,
  createNetworkHealthCheck,
  formatHealthCheckResult,
} from '../health/checks';

describe('Health Checks', () => {
  describe('performHealthCheck', () => {
    it('should run all health checks', async () => {
      const check1 = {
        name: 'check1',
        check: jest.fn().mockResolvedValue({ status: 'healthy', message: 'OK' }),
      };

      const check2 = {
        name: 'check2',
        check: jest.fn().mockResolvedValue({ status: 'healthy', message: 'OK' }),
      };

      const result = await performHealthCheck([check1, check2]);

      expect(check1.check).toHaveBeenCalled();
      expect(check2.check).toHaveBeenCalled();
      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveLength(2);
    });

    it('should report degraded status if any check is degraded', async () => {
      const checks = [
        {
          name: 'healthy-check',
          check: jest.fn().mockResolvedValue({ status: 'healthy', message: 'OK' }),
        },
        {
          name: 'degraded-check',
          check: jest.fn().mockResolvedValue({ status: 'degraded', message: 'Slow' }),
        },
      ];

      const result = await performHealthCheck(checks);
      expect(result.status).toBe('degraded');
    });

    it('should report unhealthy status if any check is unhealthy', async () => {
      const checks = [
        {
          name: 'healthy-check',
          check: jest.fn().mockResolvedValue({ status: 'healthy', message: 'OK' }),
        },
        {
          name: 'unhealthy-check',
          check: jest.fn().mockResolvedValue({ status: 'unhealthy', message: 'Failed' }),
        },
      ];

      const result = await performHealthCheck(checks);
      expect(result.status).toBe('unhealthy');
    });

    it('should handle check timeouts', async () => {
      const slowCheck = {
        name: 'slow-check',
        check: jest.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(() => resolve({ status: 'healthy' }), 2000))
        ),
      };

      const result = await performHealthCheck([slowCheck], { timeout: 100 });

      expect(result.checks[0].status).toBe('unhealthy');
      expect(result.checks[0].error).toContain('timeout');
    });

    it('should include latency for each check', async () => {
      const check = {
        name: 'test-check',
        check: jest.fn().mockResolvedValue({ status: 'healthy', message: 'OK' }),
      };

      const result = await performHealthCheck([check]);

      expect(result.checks[0].latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle check errors', async () => {
      const failingCheck = {
        name: 'failing-check',
        check: jest.fn().mockRejectedValue(new Error('Check failed')),
      };

      const result = await performHealthCheck([failingCheck]);

      expect(result.checks[0].status).toBe('unhealthy');
      expect(result.checks[0].error).toContain('Check failed');
    });
  });

  describe('createAPIHealthCheck', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should create API health check', () => {
      const check = createAPIHealthCheck('https://api.example.com/health');
      expect(check.name).toBe('api-health');
    });

    it('should return healthy on successful API response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
      });
      global.fetch = mockFetch;

      const check = createAPIHealthCheck('https://api.example.com/health');
      const result = await check.check();

      expect(result.status).toBe('healthy');
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/health');
    });

    it('should return degraded on slow API response', async () => {
      const mockFetch = jest.fn().mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({ ok: true, status: 200 }), 600)
        )
      );
      global.fetch = mockFetch;

      const check = createAPIHealthCheck('https://api.example.com/health', {
        timeout: 500,
      });
      const result = await check.check();

      expect(result.status).toBe('degraded');
    });

    it('should return unhealthy on API error', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const check = createAPIHealthCheck('https://api.example.com/health');
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('createMemoryHealthCheck', () => {
    it('should create memory health check', () => {
      const check = createMemoryHealthCheck();
      expect(check.name).toBe('memory');
    });

    it('should return healthy when memory usage is low', async () => {
      // Mock performance.memory
      (performance as any).memory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
      };

      const check = createMemoryHealthCheck({ threshold: 0.8 });
      const result = await check.check();

      expect(result.status).toBe('healthy');
    });

    it('should return degraded when memory usage exceeds threshold', async () => {
      (performance as any).memory = {
        usedJSHeapSize: 85 * 1024 * 1024, // 85MB
        jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB
      };

      const check = createMemoryHealthCheck({ threshold: 0.8 });
      const result = await check.check();

      expect(result.status).toBe('degraded');
    });
  });

  describe('createStorageHealthCheck', () => {
    it('should create storage health check', () => {
      const check = createStorageHealthCheck();
      expect(check.name).toBe('storage');
    });

    it('should return healthy when localStorage is available', async () => {
      const check = createStorageHealthCheck();
      const result = await check.check();

      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy when localStorage fails', async () => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const check = createStorageHealthCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');

      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('createNetworkHealthCheck', () => {
    it('should create network health check', () => {
      const check = createNetworkHealthCheck();
      expect(check.name).toBe('network');
    });

    it('should return healthy when online', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const check = createNetworkHealthCheck();
      const result = await check.check();

      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy when offline', async () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const check = createNetworkHealthCheck();
      const result = await check.check();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('formatHealthCheckResult', () => {
    it('should format health check result as string', () => {
      const result = {
        status: 'healthy' as const,
        timestamp: Date.now(),
        checks: [
          { name: 'api', status: 'healthy' as const, message: 'OK', latencyMs: 50 },
          { name: 'memory', status: 'healthy' as const, message: 'Good', latencyMs: 10 },
        ],
      };

      const formatted = formatHealthCheckResult(result);

      expect(formatted).toContain('Overall Status: healthy');
      expect(formatted).toContain('api');
      expect(formatted).toContain('memory');
      expect(formatted).toContain('50ms');
    });
  });
});
