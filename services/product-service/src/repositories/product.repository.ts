import { prisma } from '../db/prisma';
import { Product } from '@prisma/client';
import { CreateProductDto, UpdateProductDto, ProductFilters } from '../domain/product';
import { PaginatedResponse } from '@shopping-app/common';

export class ProductRepository {
  async findMany(filters: ProductFilters): Promise<PaginatedResponse<Product>> {
    const { page = 1, limit = 10, search, categoryId, brandId, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (isActive !== undefined) where.isActive = isActive;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          brand: true,
          images: true,
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
      },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: { sku },
    });
  }

  async create(data: CreateProductDto): Promise<Product> {
    return prisma.product.create({
      data: {
        ...data,
        images: data.images
          ? {
              create: data.images,
            }
          : undefined,
      },
      include: {
        category: true,
        brand: true,
        images: true,
      },
    });
  }

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        brand: true,
        images: true,
        variants: true,
      },
    });
  }

  async delete(id: string): Promise<Product> {
    return prisma.product.delete({
      where: { id },
    });
  }
}
