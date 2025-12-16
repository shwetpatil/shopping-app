import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Used by Kubernetes, load balancers, and monitoring systems
 * 
 * Returns:
 * - 200: Service is healthy
 * - 503: Service is unhealthy
 */
export async function GET() {
  try {
    // Basic health checks
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mfe-products',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      checks: {
        memory: checkMemory(),
        env: checkEnvironment(),
      },
    };

    // If any check fails, return 503
    const isHealthy = Object.values(checks.checks).every((check) => check.healthy);

    return NextResponse.json(checks, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

/**
 * Check memory usage
 */
function checkMemory() {
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
  const threshold = 512; // MB

  return {
    healthy: heapUsedMB < threshold,
    heapUsed: `${heapUsedMB} MB`,
    heapTotal: `${heapTotalMB} MB`,
    threshold: `${threshold} MB`,
  };
}

/**
 * Check required environment variables
 */
function checkEnvironment() {
  const required = ['NEXT_PUBLIC_API_URL'];
  const missing = required.filter((key) => !process.env[key]);

  return {
    healthy: missing.length === 0,
    missing: missing.length > 0 ? missing : undefined,
  };
}
