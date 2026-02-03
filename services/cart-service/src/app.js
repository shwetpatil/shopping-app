"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const common_1 = require("@shopping-app/common");
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(common_1.requestLogger);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', service: 'cart-service' });
});
app.use('/api/cart', cart_routes_1.default);
app.use(common_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map