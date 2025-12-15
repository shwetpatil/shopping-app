import { prisma } from '../db/prisma';
import { Category } from '@prisma/client';

export class CategoryRepository {
  async findMany(): Promise<Category[]> {
    return prisma.category.findMany({
      include: {
        children: true,
        parent: true,
      },
      orderBy: { name: 'asc' },
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
