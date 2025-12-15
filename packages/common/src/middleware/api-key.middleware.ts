import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { UnauthorizedError } from '../errors';

/**
 * API Key authentication for service-to-service communication
 */

export interface ApiKeyConfig {
  headerName?: string;
  keys?: string[];
}

/**
 * Generate a secure API key
 */
export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash API key for secure storage
 */
export const hashApiKey = (apiKey: string): string => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

/**
 * Verify API key
 */
export const verifyApiKey = (apiKey: string, hashedKey: string): boolean => {
  const hash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedKey));
};

/**
 * API Key authentication middleware
 */
export const requireApiKey = (config: ApiKeyConfig = {}) => {
  const headerName = config.headerName || 'X-API-Key';
  const validKeys = config.keys || process.env.API_KEYS?.split(',') || [];

  if (validKeys.length === 0) {
    console.warn('Warning: No API keys configured. API key authentication will fail.');
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header(headerName);

    if (!apiKey) {
      throw new UnauthorizedError('API key is required');
    }

    // Check if the provided key is valid
    const isValid = validKeys.some(validKey => {
      try {
        // Support both plain text and hashed keys
        if (validKey.length === 64) {
          // Assume it's a hashed key
          return verifyApiKey(apiKey, validKey);
        } else {
          // Plain text comparison (less secure, for development)
          return crypto.timingSafeEqual(
            Buffer.from(apiKey),
            Buffer.from(validKey)
          );
        }
      } catch {
        return false;
      }
    });

    if (!isValid) {
      throw new UnauthorizedError('Invalid API key');
    }

    next();
  };
};

/**
 * Service-to-service authentication middleware
 * Combines API key with service identifier
 */
export interface ServiceAuthConfig {
  serviceName: string;
  allowedServices?: string[];
}

export const requireServiceAuth = (config: ServiceAuthConfig) => {
  return [
    requireApiKey(),
    (req: Request, _res: Response, next: NextFunction) => {
      const serviceName = req.header('X-Service-Name');

      if (!serviceName) {
        throw new UnauthorizedError('Service name is required');
      }

      if (config.allowedServices && !config.allowedServices.includes(serviceName)) {
        throw new UnauthorizedError(`Service '${serviceName}' is not allowed to access this resource`);
      }

      // Add service info to request
      (req as any).service = {
        name: serviceName,
        timestamp: Date.now(),
      };

      next();
    },
  ];
};

/**
 * API Key rate limiting (stricter than user rate limits)
 */
export const apiKeyRateLimit = (maxRequests: number = 1000, windowMs: number = 60000) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.header('X-API-Key');

    if (!apiKey) {
      return next();
    }

    const now = Date.now();
    const keyData = requests.get(apiKey);

    if (!keyData || now > keyData.resetTime) {
      // Reset or initialize
      requests.set(apiKey, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (keyData.count >= maxRequests) {
      const resetIn = Math.ceil((keyData.resetTime - now) / 1000);
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(keyData.resetTime).toISOString(),
        'Retry-After': resetIn.toString(),
      });
      throw new UnauthorizedError('API key rate limit exceeded');
    }

    keyData.count++;
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - keyData.count).toString(),
      'X-RateLimit-Reset': new Date(keyData.resetTime).toISOString(),
    });

    next();
  };
};

/**
 * Middleware to add service authentication headers to outgoing requests
 */
export const addServiceAuthHeaders = (serviceName: string, apiKey: string) => {
  return (config: any) => {
    config.headers = {
      ...config.headers,
      'X-API-Key': apiKey,
      'X-Service-Name': serviceName,
    };
    return config;
  };
};
