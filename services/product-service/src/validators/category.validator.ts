import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional().default(true),
    displayOrder: z.number().int().optional().default(0),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
  }),
});

export const getCategoriesSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(Number),
    limit: z.string().optional().transform(Number),
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    parentId: z.string().uuid().optional(),
  }),
});
