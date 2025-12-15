/**
 * Health Check Utilities
 * Monitor MFE status and dependencies
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  checks: Record<string, CheckResult>;
  metadata?: Record<string, any>;
}

export interface CheckResult {
  status: HealthStatus;
  message?: string;
  latency?: number;
  metadata?: Record<string, any>;
}

export type HealthCheckFunction = () => Promise<CheckResult>;

export interface HealthCheckConfig {
  mfeName: string;
  checks: Record<string, HealthCheckFunction>;
  timeout?: number;
}

/**
 * Perform health check
 */
export async function performHealthCheck(
  config: HealthCheckConfig
): Promise<HealthCheckResult> {
  const { mfeName, checks, timeout = 5000 } = config;
  const results: Record<string, CheckResult> = {};
  let overallStatus: HealthStatus = 'healthy';

  // Run all checks with timeout
  const checkPromises = Object.entries(checks).map(async ([name, checkFn]) => {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        checkFn(),
        new Promise<CheckResult>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ]);

      result.latency = Date.now() - startTime;
      results[name] = result;

      // Update overall status
      if (result.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (result.status === 'degraded' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    } catch (error) {
      results[name] = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Check failed',
        latency: Date.now() - startTime,
      };
      overallStatus = 'unhealthy';
    }
  });

  await Promise.all(checkPromises);

  return {
    status: overallStatus,
    timestamp: new Date(),
    checks: results,
    metadata: {
      mfeName,
    },
  };
}

/**
 * Check API endpoint health
 */
export function createAPIHealthCheck(url: string): HealthCheckFunction {
  return async () => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          latency,
          message: `API responding (${response.status})`,
        };
      } else if (response.status >= 500) {
        return {
          status: 'unhealthy',
          latency,
          message: `API error (${response.status})`,
        };
      } else {
        return {
          status: 'degraded',
          latency,
          message: `API degraded (${response.status})`,
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'API unreachable',
      };
    }
  };
}

/**
 * Check memory usage
 */
export function createMemoryHealthCheck(thresholdMB: number = 512): HealthCheckFunction {
  return async () => {
    if (typeof performance === 'undefined' || !(performance as any).memory) {
      return {
        status: 'healthy',
        message: 'Memory monitoring not available',
      };
    }

    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
    const percentUsed = (usedMB / limitMB) * 100;

    if (percentUsed > 90) {
      return {
        status: 'unhealthy',
        message: `Memory critical: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB (${percentUsed.toFixed(1)}%)`,
        metadata: { usedMB, limitMB, percentUsed },
      };
    } else if (percentUsed > 70) {
      return {
        status: 'degraded',
        message: `Memory high: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB (${percentUsed.toFixed(1)}%)`,
        metadata: { usedMB, limitMB, percentUsed },
      };
    } else {
      return {
        status: 'healthy',
        message: `Memory OK: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB (${percentUsed.toFixed(1)}%)`,
        metadata: { usedMB, limitMB, percentUsed },
      };
    }
  };
}

/**
 * Check localStorage availability
 */
export function createStorageHealthCheck(): HealthCheckFunction {
  return async () => {
    try {
      const testKey = '__health_check__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      return {
        status: 'healthy',
        message: 'LocalStorage available',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'LocalStorage unavailable',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  };
}

/**
 * Check network connectivity
 */
export function createNetworkHealthCheck(): HealthCheckFunction {
  return async () => {
    if (typeof navigator === 'undefined') {
      return {
        status: 'healthy',
        message: 'Network check not available',
      };
    }

    const online = navigator.onLine;
    const connection = (navigator as any).connection;

    if (!online) {
      return {
        status: 'unhealthy',
        message: 'Offline',
      };
    }

    if (connection) {
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        return {
          status: 'degraded',
          message: `Slow network (${effectiveType})`,
          metadata: { effectiveType },
        };
      }
    }

    return {
      status: 'healthy',
      message: 'Online',
      metadata: connection ? { effectiveType: connection.effectiveType } : undefined,
    };
  };
}

/**
 * Create periodic health check
 */
export function createPeriodicHealthCheck(
  config: HealthCheckConfig,
  intervalMs: number = 30000,
  onResult?: (result: HealthCheckResult) => void
): () => void {
  const interval = setInterval(async () => {
    const result = await performHealthCheck(config);
    if (onResult) {
      onResult(result);
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

/**
 * Format health check result as string
 */
export function formatHealthCheckResult(result: HealthCheckResult): string {
  const lines = [
    `Health Check: ${result.status.toUpperCase()}`,
    `Timestamp: ${result.timestamp.toISOString()}`,
    '',
    'Checks:',
  ];

  for (const [name, check] of Object.entries(result.checks)) {
    const icon = check.status === 'healthy' ? '✓' : check.status === 'degraded' ? '⚠' : '✗';
    const latency = check.latency ? ` (${check.latency}ms)` : '';
    lines.push(`  ${icon} ${name}: ${check.status}${latency}`);
    if (check.message) {
      lines.push(`    ${check.message}`);
    }
  }

  return lines.join('\n');
}
