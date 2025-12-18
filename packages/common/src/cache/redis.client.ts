import Redis from 'ioredis';
import { logger } from '../logger';

class RedisClient {
  private static instance: Redis | null = null;
  private static isConnected = false;

  private constructor() {}

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      RedisClient.instance = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      });

      RedisClient.instance.on('connect', () => {
        RedisClient.isConnected = true;
        logger.info('Redis client connected');
      });

      RedisClient.instance.on('error', (error) => {
        RedisClient.isConnected = false;
        logger.error('Redis connection error:', error);
      });

      RedisClient.instance.on('close', () => {
        RedisClient.isConnected = false;
        logger.warn('Redis connection closed');
      });
    }

    return RedisClient.instance;
  }

  public static getConnectionStatus(): boolean {
    return RedisClient.isConnected;
  }

  public static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      RedisClient.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }
}

export default RedisClient;
