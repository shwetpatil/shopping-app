import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Redis from 'ioredis';
import { UnauthorizedError } from '../errors';

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

// Redis client for token blacklist
let redisClient: Redis | null = null;

const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redisClient;
};

/**
 * Check if token is blacklisted
 */
const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    const redis = getRedisClient();
    const result = await redis.get(`blacklist:${token}`);
    return result !== null;
  } catch (error) {
    console.error('Redis error checking blacklist:', error);
    // If Redis is down, allow the request (fail open)
    return false;
  }
};

/**
 * Add token to blacklist
 */
export const blacklistToken = async (token: string, expiresIn: number = 900): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.setex(`blacklist:${token}`, expiresIn, '1');
  } catch (error) {
    console.error('Redis error adding to blacklist:', error);
    throw error;
  }
};

/**
 * Remove token from blacklist (for testing purposes)
 */
export const unblacklistToken = async (token: string): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.del(`blacklist:${token}`);
  } catch (error) {
    console.error('Redis error removing from blacklist:', error);
    throw error;
  }
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid token');
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions');
    }

    next();
  };
};

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const blacklisted = await isTokenBlacklisted(token);
    if (!blacklisted) {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;
      req.user = payload;
    }
  } catch (error) {
    // Silently fail for optional auth
  }

  next();
};
