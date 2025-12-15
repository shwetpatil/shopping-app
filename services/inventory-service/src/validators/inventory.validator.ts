import { z } from 'zod';

export const createInventorySchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    sku: z.string().min(1, 'SKU is required'),
    availableQuantity: z.number().int().min(0, 'Available quantity must be non-negative'),
    reorderLevel: z.number().int().min(0).optional(),
    reorderQuantity: z.number().int().min(0).optional(),
  }),
});

export const updateInventorySchema = z.object({
  body: z.object({
    reorderLevel: z.number().int().min(0).optional(),
    reorderQuantity: z.number().int().min(0).optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    quantity: z.number().int(),
    type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT']),
    reference: z.string().optional(),
    notes: z.string().optional(),
  }),
});
