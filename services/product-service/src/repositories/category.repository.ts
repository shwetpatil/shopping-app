import { prisma } from '../db/prisma';
import { Category } from '@prisma/client';
import { CategoryFilters } from '../domain/category';

export class CategoryRepository {
  async findMany(filters?: CategoryFilters): Promise<Category[]> {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    return prisma.category.findMany({
      where,
      include: {
        children: true,
        parent: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        products: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
    });
  }

  async create(data: any): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Category> {
    return prisma.category.delete({
      where: { id },
    });
  }
}
