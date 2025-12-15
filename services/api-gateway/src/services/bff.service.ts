import axios from 'axios';
import { logger, InternalServerError } from '@shopping-app/common';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

export class BFFService {
  /**
   * Aggregate data for home page
   * Combines featured products, categories, and brands
   */
  async getHomePageData() {
    try {
      const [featuredProducts, categories, brands] = await Promise.all([
        this.getFeaturedProducts(),
        this.getCategories(),
        this.getBrands(),
      ]);

      return {
        featuredProducts,
        categories: categories.slice(0, 8), // Top 8 categories
        brands: brands.slice(0, 10), // Top 10 brands
      };
    } catch (error) {
      logger.error('Failed to fetch home page data', { error });
      throw new InternalServerError('Failed to load home page data');
    }
  }

  /**
   * Get product details with related products
   */
  async getProductDetails(productId: string) {
    try {
      const product = await this.getProduct(productId);

      // Fetch related products from same category
      const relatedProducts = product.categoryId
        ? await this.getProductsByCategory(product.categoryId, 4)
        : [];

      return {
        product,
        relatedProducts: relatedProducts.filter((p: any) => p.id !== productId),
      };
    } catch (error) {
      logger.error('Failed to fetch product details', { error, productId });
      throw new InternalServerError('Failed to load product details');
    }
  }

  /**
   * Get user dashboard with orders and recommendations
   */
  async getUserDashboard(userId: string) {
    try {
      // Fetch user's recent orders
      const recentOrders = await this.getUserOrders(userId, 1, 5);

      // Get featured products as recommendations
      const recommendations = await this.getFeaturedProducts(8);

      return {
        recentOrders: recentOrders.data,
        recommendations,
        stats: {
          totalOrders: recentOrders.pagination.total,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch user dashboard', { error, userId });
      throw new InternalServerError('Failed to load dashboard');
    }
  }

  // Helper methods for service calls
  private async getFeaturedProducts(limit: number = 12) {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, {
      params: { limit, isFeatured: true },
    });
    return response.data.data.data;
  }

  private async getCategories() {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/categories`);
    return response.data.data;
  }

  private async getBrands() {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/brands`);
    return response.data.data;
  }

  private async getProduct(productId: string) {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`);
    return response.data.data;
  }

  private async getProductsByCategory(categoryId: string, limit: number = 4) {
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products`, {
      params: { categoryId, limit },
    });
    return response.data.data.data;
  }

  private async getUserOrders(userId: string, page: number = 1, limit: number = 5) {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders`, {
      params: { page, limit },
      headers: {
        // In real implementation, forward the auth token
        'x-user-id': userId,
      },
    });
    return response.data.data;
  }
}
