import { Cart } from '../domain/cart';
export declare class CartRepository {
    private getKey;
    getCart(userId: string): Promise<Cart | null>;
    saveCart(userId: string, cart: Cart, ttl: number): Promise<void>;
    deleteCart(userId: string): Promise<void>;
    extendCartExpiry(userId: string, ttl: number): Promise<void>;
}
//# sourceMappingURL=cart.repository.d.ts.map