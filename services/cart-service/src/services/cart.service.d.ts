import { Cart } from '../domain/cart';
export declare class CartService {
    private cartRepository;
    private productService;
    private readonly CART_TTL;
    private cacheEnabled;
    constructor();
    getCart(userId: string): Promise<Cart>;
    addItem(userId: string, productId: string, quantity: number): Promise<Cart>;
    updateItem(userId: string, productId: string, quantity: number): Promise<Cart>;
    removeItem(userId: string, productId: string): Promise<Cart>;
    clearCart(userId: string): Promise<void>;
    mergeGuestCart(userId: string, guestCartId: string): Promise<Cart>;
}
//# sourceMappingURL=cart.service.d.ts.map