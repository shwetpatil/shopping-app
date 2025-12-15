import { redisClient } from '../db/redis';
import { Cart } from '../domain/cart';

export class CartRepository {
  private getKey(userId: string): string {
    return `cart:${userId}`;
  }

  async getCart(userId: string): Promise<Cart | null> {
    const key = this.getKey(userId);
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  async saveCart(userId: string, cart: Cart, ttl: number): Promise<void> {
    const key = this.getKey(userId);
    await redisClient.setEx(key, ttl, JSON.stringify(cart));
  }

  async deleteCart(userId: string): Promise<void> {
    const key = this.getKey(userId);
    await redisClient.del(key);
  }

  async extendCartExpiry(userId: string, ttl: number): Promise<void> {
    const key = this.getKey(userId);
    await redisClient.expire(key, ttl);
  }
}
