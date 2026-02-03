import { z } from 'zod';
export declare const addToCartSchema: z.ZodObject<{
    body: z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
    }, {
        productId: string;
        quantity: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        productId: string;
        quantity: number;
    };
}, {
    body: {
        productId: string;
        quantity: number;
    };
}>;
export declare const updateCartItemSchema: z.ZodObject<{
    body: z.ZodObject<{
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        quantity: number;
    }, {
        quantity: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        quantity: number;
    };
}, {
    body: {
        quantity: number;
    };
}>;
//# sourceMappingURL=cart.validator.d.ts.map