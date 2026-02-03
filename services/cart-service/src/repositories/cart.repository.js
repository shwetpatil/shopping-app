"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartRepository = void 0;
const redis_1 = require("../db/redis");
class CartRepository {
    getKey(userId) {
        return `cart:${userId}`;
    }
    async getCart(userId) {
        const key = this.getKey(userId);
        const data = await redis_1.redisClient.get(key);
        if (!data) {
            return null;
        }
        return JSON.parse(data);
    }
    async saveCart(userId, cart, ttl) {
        const key = this.getKey(userId);
        await redis_1.redisClient.setEx(key, ttl, JSON.stringify(cart));
    }
    async deleteCart(userId) {
        const key = this.getKey(userId);
        await redis_1.redisClient.del(key);
    }
    async extendCartExpiry(userId, ttl) {
        const key = this.getKey(userId);
        await redis_1.redisClient.expire(key, ttl);
    }
}
exports.CartRepository = CartRepository;
//# sourceMappingURL=cart.repository.js.map