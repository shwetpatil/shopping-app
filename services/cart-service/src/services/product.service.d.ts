interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    sku: string;
    images?: Array<{
        url: string;
    }>;
}
export declare class ProductService {
    getProductsByIds(productIds: string[]): Promise<Product[]>;
}
export {};
//# sourceMappingURL=product.service.d.ts.map