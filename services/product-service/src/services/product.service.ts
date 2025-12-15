import { NotFoundError, BadRequestError } from '@shopping-app/common';
import { ProductRepository } from '../repositories/product.repository';
import { CreateProductDto, UpdateProductDto, ProductFilters } from '../domain/product';

export class ProductService {
  private productRepository: ProductRepository;

  constructor() {
    this.productRepository = new ProductRepository();
  }

  async getProducts(filters: ProductFilters) {
    return this.productRepository.findMany(filters);
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return product;
  }

  async createProduct(data: CreateProductDto) {
    // Check if SKU already exists
    const existingProduct = await this.productRepository.findBySku(data.sku);
    if (existingProduct) {
      throw new BadRequestError('Product with this SKU already exists');
    }

    return this.productRepository.create(data);
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    const existingProduct = await this.productRepository.findById(id);
    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    // If SKU is being updated, check if it's unique
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await this.productRepository.findBySku(data.sku);
      if (skuExists) {
        throw new BadRequestError('Product with this SKU already exists');
      }
    }

    return this.productRepository.update(id, data);
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return this.productRepository.delete(id);
  }
}
