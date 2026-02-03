"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const common_1 = require("@shopping-app/common");
const app_1 = __importDefault(require("./app"));
const redis_1 = require("./db/redis");
dotenv_1.default.config();
const config_1 = require("@shopping-app/config");
const PORT = process.env.PORT || config_1.SERVICE_PORTS.CART;
const startServer = async () => {
    try {
        await redis_1.redisClient.connect();
        common_1.logger.info('Redis connected successfully');
        app_1.default.listen(PORT, () => {
            common_1.logger.info(`🛒 Cart Service started on port ${PORT}`);
            common_1.logger.info(`Environment: ${process.env.NODE_ENV}`);
            common_1.logger.info(`Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        common_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
const shutdown = async () => {
    common_1.logger.info('Shutting down gracefully...');
    await redis_1.redisClient.quit();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
startServer();
//# sourceMappingURL=server.js.map