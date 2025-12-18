import axios from 'axios';
import { logger, BadRequestError } from '@shopping-app/common';
import { SERVICE_URLS } from '@shopping-app/config';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || SERVICE_URLS.PRODUCT;

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  sku: string;
  images?: Array<{ url: string; altText?: string }>;
}

export class ProductService {
  async getProductsByIds(productIds: string[]): Promise<Product[]> {
    try {
      // In a real implementation, this should be a bulk endpoint
      // For now, we'll fetch products individually
      const productPromises = productIds.map((id) =>
        axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`).then((res) => res.data.data)
      );

      const products = await Promise.all(productPromises);
      return products;
    } catch (error) {
      logger.error('Failed to fetch products from product service', { error, productIds });
      throw new BadRequestError('Failed to validate products');
    }
  }
}
