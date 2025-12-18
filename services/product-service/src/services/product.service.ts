import { NotFoundError, BadRequestError, productCache, logger } from '@shopping-app/common';
import { ProductRepository } from '../repositories/product.repository';
import { CreateProductDto, UpdateProductDto, ProductFilters } from '../domain/product';
import { emitInventoryUpdate, emitProductUpdate, broadcastProductEvent } from '../websocket';

export class ProductService {
  private productRepository: ProductRepository;
  private cacheEnabled: boolean;

  constructor() {
    this.productRepository = new ProductRepository();
    this.cacheEnabled = process.env.REDIS_ENABLED !== 'false';
  }

  async getProducts(filters: ProductFilters) {
    // Only cache if no specific filters (common case: listing all products)
    const shouldCache = !filters.categoryId && !filters.brandId && !filters.search;
    
    if (this.cacheEnabled && shouldCache) {
      const cacheKey = `list:${filters.page || 1}:${filters.limit || 10}`;
      
      return productCache.getOrSet(
        cacheKey,
        () => this.productRepository.findMany(filters),
        { ttl: 300 } // 5 minutes
      );
    }

    return this.productRepository.findMany(filters);
  }

  async getProductById(id: string) {
    if (this.cacheEnabled) {
      return productCache.getOrSet(
        `detail:${id}`,
        async () => {
          const product = await this.productRepository.findById(id);
          if (!product) {
            throw new NotFoundError('Product not found');
          }
          return product;
        },
        { ttl: 600 } // 10 minutes
      );
    }

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

    const newProduct = await this.productRepository.create(data);

    // Invalidate list cache since we added a new product
    if (this.cacheEnabled) {
      await productCache.delPattern('list:*');
      logger.debug('Invalidated product list cache after creation');
    }

    // Broadcast new product event to all clients
    broadcastProductEvent('product:created', { product: newProduct });

    return newProduct;
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

    const updatedProduct = await this.productRepository.update(id, data);

    // Invalidate cache for this product and list cache
    if (this.cacheEnabled) {
      await productCache.del(`detail:${id}`);
      await productCache.delPattern('list:*');
      logger.debug(`Invalidated cache for product ${id}`);
    }

    // Emit WebSocket event for real-time updates
    if (data.stock !== undefined && data.stock !== existingProduct.stock) {
      emitInventoryUpdate(id, data.stock);
    }
    
    // Emit general product update
    emitProductUpdate(id, data);

    return updatedProduct;
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const result = await this.productRepository.delete(id);

    // Invalidate cache
    if (this.cacheEnabled) {
      await productCache.del(`detail:${id}`);
      await productCache.delPattern('list:*');
      logger.debug(`Invalidated cache for deleted product ${id}`);
    }

    return result;
  }
}
