"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@shopping-app/common");
const cart_repository_1 = require("../repositories/cart.repository");
const product_service_1 = require("./product.service");
class CartService {
    cartRepository;
    productService;
    CART_TTL = parseInt(process.env.CART_TTL || '604800'); // 7 days
    cacheEnabled;
    constructor() {
        this.cartRepository = new cart_repository_1.CartRepository();
        this.productService = new product_service_1.ProductService();
        this.cacheEnabled = process.env.REDIS_ENABLED !== 'false';
    }
    async getCart(userId) {
        // Try cache first for cart data
        if (this.cacheEnabled) {
            const cached = await common_1.cartCache.get(`user:${userId}`);
            if (cached) {
                common_1.logger.debug(`Cart cache hit for user ${userId}`);
                return cached;
            }
        }
        const cart = await this.cartRepository.getCart(userId);
        if (!cart || !cart.items || cart.items.length === 0) {
            return {
                userId,
                items: [],
                subtotal: 0,
                total: 0,
                itemCount: 0,
            };
        }
        // Refresh product prices
        const productIds = cart.items.map((item) => item.productId);
        const products = await this.productService.getProductsByIds(productIds);
        const updatedItems = cart.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            if (product) {
                return {
                    ...item,
                    price: Number(product.price),
                    name: product.name,
                    image: product.images?.[0]?.url || item.image,
                };
            }
            return item;
        });
        const subtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const updatedCart = {
            userId,
            items: updatedItems,
            subtotal,
            total: subtotal,
            itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        };
        // Save updated cart
        await this.cartRepository.saveCart(userId, updatedCart, this.CART_TTL);
        // Cache the cart
        if (this.cacheEnabled) {
            await common_1.cartCache.set(`user:${userId}`, updatedCart, { ttl: 1800 }); // 30 min
        }
        return updatedCart;
    }
    async addItem(userId, productId, quantity) {
        if (quantity <= 0) {
            throw new common_1.BadRequestError('Quantity must be greater than 0');
        }
        // Validate product exists
        const products = await this.productService.getProductsByIds([productId]);
        if (products.length === 0) {
            throw new common_1.BadRequestError('Product not found');
        }
        const product = products[0];
        const cart = await this.cartRepository.getCart(userId) || {
            userId,
            items: [],
            subtotal: 0,
            total: 0,
            itemCount: 0,
        };
        const existingItemIndex = cart.items.findIndex((item) => item.productId === productId);
        if (existingItemIndex >= 0) {
            cart.items[existingItemIndex].quantity += quantity;
        }
        else {
            cart.items.push({
                productId: product.id,
                name: product.name,
                sku: product.sku,
                price: Number(product.price),
                quantity,
                image: product.images?.[0]?.url,
            });
        }
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cart.total = cart.subtotal;
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        await this.cartRepository.saveCart(userId, cart, this.CART_TTL);
        // Invalidate cache
        if (this.cacheEnabled) {
            await common_1.cartCache.del(`user:${userId}`);
        }
        common_1.logger.info('Item added to cart', { userId, productId, quantity });
        return cart;
    }
    async updateItem(userId, productId, quantity) {
        if (quantity < 0) {
            throw new common_1.BadRequestError('Quantity cannot be negative');
        }
        const cart = await this.cartRepository.getCart(userId);
        if (!cart) {
            throw new common_1.BadRequestError('Cart not found');
        }
        const itemIndex = cart.items.findIndex((item) => item.productId === productId);
        if (itemIndex === -1) {
            throw new common_1.BadRequestError('Item not found in cart');
        }
        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        }
        else {
            cart.items[itemIndex].quantity = quantity;
        }
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cart.total = cart.subtotal;
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        await this.cartRepository.saveCart(userId, cart, this.CART_TTL);
        // Invalidate cache
        if (this.cacheEnabled) {
            await common_1.cartCache.del(`user:${userId}`);
        }
        common_1.logger.info('Cart item updated', { userId, productId, quantity });
        return cart;
    }
    async removeItem(userId, productId) {
        const cart = await this.cartRepository.getCart(userId);
        if (!cart) {
            throw new common_1.BadRequestError('Cart not found');
        }
        cart.items = cart.items.filter((item) => item.productId !== productId);
        cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cart.total = cart.subtotal;
        cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        await this.cartRepository.saveCart(userId, cart, this.CART_TTL);
        // Invalidate cache
        if (this.cacheEnabled) {
            await common_1.cartCache.del(`user:${userId}`);
        }
        common_1.logger.info('Item removed from cart', { userId, productId });
        return cart;
    }
    async clearCart(userId) {
        await this.cartRepository.deleteCart(userId);
        // Invalidate cache
        if (this.cacheEnabled) {
            await common_1.cartCache.del(`user:${userId}`);
        }
        common_1.logger.info('Cart cleared', { userId });
    }
    async mergeGuestCart(userId, guestCartId) {
        const guestCart = await this.cartRepository.getCart(guestCartId);
        if (!guestCart || guestCart.items.length === 0) {
            return this.getCart(userId);
        }
        const userCart = await this.cartRepository.getCart(userId) || {
            userId,
            items: [],
            subtotal: 0,
            total: 0,
            itemCount: 0,
        };
        // Merge items
        for (const guestItem of guestCart.items) {
            const existingItemIndex = userCart.items.findIndex((item) => item.productId === guestItem.productId);
            if (existingItemIndex >= 0) {
                userCart.items[existingItemIndex].quantity += guestItem.quantity;
            }
            else {
                userCart.items.push(guestItem);
            }
        }
        userCart.subtotal = userCart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        userCart.total = userCart.subtotal;
        userCart.itemCount = userCart.items.reduce((sum, item) => sum + item.quantity, 0);
        await this.cartRepository.saveCart(userId, userCart, this.CART_TTL);
        await this.cartRepository.deleteCart(guestCartId);
        common_1.logger.info('Guest cart merged', { userId, guestCartId });
        return userCart;
    }
}
exports.CartService = CartService;
//# sourceMappingURL=cart.service.js.map