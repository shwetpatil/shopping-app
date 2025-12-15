import { NotFoundError, BadRequestError } from '@shopping-app/common';
import { CategoryRepository } from '../repositories/category.repository';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async getCategories() {
    return this.categoryRepository.findMany();
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async createCategory(data: any) {
    const existingCategory = await this.categoryRepository.findBySlug(data.slug);
    if (existingCategory) {
      throw new BadRequestError('Category with this slug already exists');
    }

    return this.categoryRepository.create(data);
  }

  async updateCategory(id: string, data: any) {
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    if (data.slug && data.slug !== existingCategory.slug) {
      const slugExists = await this.categoryRepository.findBySlug(data.slug);
      if (slugExists) {
        throw new BadRequestError('Category with this slug already exists');
      }
    }

    return this.categoryRepository.update(id, data);
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return this.categoryRepository.delete(id);
  }
}
