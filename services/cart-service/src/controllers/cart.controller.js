"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const cart_service_1 = require("../services/cart.service");
class CartController {
    cartService;
    constructor() {
        this.cartService = new cart_service_1.CartService();
    }
    getCart = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const cart = await this.cartService.getCart(userId);
            res.status(200).json({
                success: true,
                data: cart,
            });
        }
        catch (error) {
            next(error);
        }
    };
    addItem = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { productId, quantity } = req.body.body;
            const cart = await this.cartService.addItem(userId, productId, quantity);
            res.status(200).json({
                success: true,
                data: cart,
                message: 'Item added to cart',
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateItem = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const { quantity } = req.body.body;
            const cart = await this.cartService.updateItem(userId, productId, quantity);
            res.status(200).json({
                success: true,
                data: cart,
                message: 'Cart item updated',
            });
        }
        catch (error) {
            next(error);
        }
    };
    removeItem = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { productId } = req.params;
            const cart = await this.cartService.removeItem(userId, productId);
            res.status(200).json({
                success: true,
                data: cart,
                message: 'Item removed from cart',
            });
        }
        catch (error) {
            next(error);
        }
    };
    clearCart = async (req, res, next) => {
        try {
            const userId = req.user.id;
            await this.cartService.clearCart(userId);
            res.status(200).json({
                success: true,
                message: 'Cart cleared',
            });
        }
        catch (error) {
            next(error);
        }
    };
    mergeGuestCart = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { guestCartId } = req.body;
            const cart = await this.cartService.mergeGuestCart(userId, guestCartId);
            res.status(200).json({
                success: true,
                data: cart,
                message: 'Guest cart merged successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.CartController = CartController;
//# sourceMappingURL=cart.controller.js.map