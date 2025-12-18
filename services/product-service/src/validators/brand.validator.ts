import { z } from 'zod';

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Brand name is required').max(100, 'Brand name too long'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    logoUrl: z.string().url('Invalid logo URL').optional(),
    websiteUrl: z.string().url('Invalid website URL').optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    logoUrl: z.string().url('Invalid logo URL').optional().nullable(),
    websiteUrl: z.string().url('Invalid website URL').optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const getBrandsSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }),
});
