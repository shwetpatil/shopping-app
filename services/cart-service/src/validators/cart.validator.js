"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartItemSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
exports.addToCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid('Invalid product ID'),
        quantity: zod_1.z.number().int().positive('Quantity must be positive'),
    }),
});
exports.updateCartItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        quantity: zod_1.z.number().int().min(0, 'Quantity cannot be negative'),
    }),
});
//# sourceMappingURL=cart.validator.js.map