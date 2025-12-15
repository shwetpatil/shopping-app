import { prisma } from '../db/prisma';
import { Brand } from '@prisma/client';

export class BrandRepository {
  async findMany(): Promise<Brand[]> {
    return prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
  }

  async findBySlug(slug: string): Promise<Brand | null> {
    return prisma.brand.findUnique({
      where: { slug },
    });
  }

  async create(data: any): Promise<Brand> {
    return prisma.brand.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<Brand> {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Brand> {
    return prisma.brand.delete({
      where: { id },
    });
  }
}
