"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const common_1 = require("@shopping-app/common");
const cart_validator_1 = require("../validators/cart.validator");
const router = (0, express_1.Router)();
const cartController = new cart_controller_1.CartController();
router.get('/', common_1.requireAuth, cartController.getCart);
router.post('/items', common_1.requireAuth, (0, common_1.validate)(cart_validator_1.addToCartSchema), cartController.addItem);
router.put('/items/:productId', common_1.requireAuth, (0, common_1.validate)(cart_validator_1.updateCartItemSchema), cartController.updateItem);
router.delete('/items/:productId', common_1.requireAuth, cartController.removeItem);
router.delete('/', common_1.requireAuth, cartController.clearCart);
router.post('/merge', common_1.requireAuth, cartController.mergeGuestCart);
exports.default = router;
//# sourceMappingURL=cart.routes.js.map