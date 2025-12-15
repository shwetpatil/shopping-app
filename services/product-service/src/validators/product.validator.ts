import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    sku: z.string().min(1, 'SKU is required'),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    images: z
      .array(
        z.object({
          url: z.string().url('Invalid image URL'),
          altText: z.string().optional(),
          position: z.number().optional(),
        })
      )
      .optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    sku: z.string().min(1).optional(),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  }),
});

export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
    search: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    brandId: z.string().uuid().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});
