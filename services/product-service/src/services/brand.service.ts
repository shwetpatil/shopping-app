import { NotFoundError, BadRequestError } from '@shopping-app/common';
import { BrandRepository } from '../repositories/brand.repository';

export class BrandService {
  private brandRepository: BrandRepository;

  constructor() {
    this.brandRepository = new BrandRepository();
  }

  async getBrands() {
    return this.brandRepository.findMany();
  }

  async getBrandById(id: string) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }
    return brand;
  }

  async createBrand(data: any) {
    const existingBrand = await this.brandRepository.findBySlug(data.slug);
    if (existingBrand) {
      throw new BadRequestError('Brand with this slug already exists');
    }

    return this.brandRepository.create(data);
  }

  async updateBrand(id: string, data: any) {
    const existingBrand = await this.brandRepository.findById(id);
    if (!existingBrand) {
      throw new NotFoundError('Brand not found');
    }

    if (data.slug && data.slug !== existingBrand.slug) {
      const slugExists = await this.brandRepository.findBySlug(data.slug);
      if (slugExists) {
        throw new BadRequestError('Brand with this slug already exists');
      }
    }

    return this.brandRepository.update(id, data);
  }

  async deleteBrand(id: string) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundError('Brand not found');
    }

    return this.brandRepository.delete(id);
  }
}
