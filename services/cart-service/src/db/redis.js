"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
const common_1 = require("@shopping-app/common");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0'),
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => common_1.logger.error('Redis Client Error', err));
redisClient.on('connect', () => common_1.logger.info('Redis Client Connected'));
//# sourceMappingURL=redis.js.map