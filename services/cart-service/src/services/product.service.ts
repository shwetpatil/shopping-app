import axios from 'axios';
import { logger, BadRequestError } from '@shopping-app/common';
import { SERVICE_URLS } from '../../../../packages/config/dist/index.js';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT;

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sku: string;
  images?: Array<{ url: string }>;
}

export class ProductService {
  async getProductsByIds(productIds: string[]): Promise<Product[]> {
    try {
      const productPromises = productIds.map((id) =>
        axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`).then((res) => res.data.data)
      );

      const products = await Promise.all(productPromises);
      return products;
    } catch (error) {
      logger.error('Failed to fetch products', { error, productIds });
      throw new BadRequestError('Failed to validate products');
    }
  }
}
