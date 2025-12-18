import { NotFoundError, BadRequestError, categoryCache, logger } from '@shopping-app/common';
import { CategoryRepository } from '../repositories/category.repository';
import { CreateCategoryDto, UpdateCategoryDto, CategoryFilters } from '../domain/category';

export class CategoryService {
  private categoryRepository: CategoryRepository;
  private cacheEnabled: boolean;

  constructor() {
    this.categoryRepository = new CategoryRepository();
    this.cacheEnabled = process.env.REDIS_ENABLED !== 'false';
  }

  async getCategories(filters?: CategoryFilters) {
    if (this.cacheEnabled && !filters?.parentId) {
      return categoryCache.getOrSet(
        'all',
        () => this.categoryRepository.findMany(filters),
        { ttl: 3600 } // 1 hour - categories change rarely
      );
    }

    return this.categoryRepository.findMany(filters);
  }

  async getCategoryById(id: string) {
    if (this.cacheEnabled) {
      return categoryCache.getOrSet(
        `detail:${id}`,
        async () => {
          const category = await this.categoryRepository.findById(id);
          if (!category) {
            throw new NotFoundError('Category not found');
          }
          return category;
        },
        { ttl: 3600 } // 1 hour
      );
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return category;
  }

  async createCategory(data: CreateCategoryDto) {
    const existingCategory = await this.categoryRepository.findBySlug(data.slug);
    if (existingCategory) {
      throw new BadRequestError('Category with this slug already exists');
    }

    const newCategory = await this.categoryRepository.create(data);

    // Invalidate cache
    if (this.cacheEnabled) {
      await categoryCache.clear();
      logger.debug('Invalidated category cache after creation');
    }

    return newCategory;
  }

  async updateCategory(id: string, data: UpdateCategoryDto) {
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

    const updatedCategory = await this.categoryRepository.update(id, data);

    // Invalidate cache
    if (this.cacheEnabled) {
      await categoryCache.del(`detail:${id}`);
      await categoryCache.del('all');
      logger.debug(`Invalidated cache for category ${id}`);
    }

    return updatedCategory;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const result = await this.categoryRepository.delete(id);

    // Invalidate cache
    if (this.cacheEnabled) {
      await categoryCache.clear();
      logger.debug(`Invalidated category cache after deletion ${id}`);
    }

    return result;
  }
}
