/**
 * Product API client
 * Handles fetching products from backend with proper error handling
 */

import type { Product as ContractProduct } from '@shopping-app/mfe-contracts';
import { SERVICE_PORTS } from '@shopping-app/config';
import { env } from './env';
import { logger } from './logger';
// Only import mock data when needed to avoid bundling in prod
const mockProducts = env.NEXT_PUBLIC_USE_MOCK_DATA ? require('../__tests__/fixtures/products.fixture').mockProducts : undefined;

// Use API Gateway as single entry point (not direct service calls)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `http://localhost:${SERVICE_PORTS.API_GATEWAY}`;

export type Product = ContractProduct;

export interface FetchProductsOptions {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch products from the backend API
 */
export async function fetchProducts(options?: FetchProductsOptions): Promise<Product[]> {
  logger.info('Shweta Returning mock products:', env.NEXT_PUBLIC_USE_MOCK_DATA, mockProducts);

  if (env.NEXT_PUBLIC_USE_MOCK_DATA && mockProducts) {
    // Optionally filter/slice mock data based on options
    let products = mockProducts;
    if (options?.category) {
      products = products.filter((p: Product) => p.category === options.category);
    }
    if (options?.search) {
      const search = options.search.toLowerCase();
      products = products.filter((p: Product) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search));
    }
    if (options?.offset) {
      products = products.slice(options.offset);
    }
    if (options?.limit) {
      products = products.slice(0, options.limit);
    }
    logger.info('Returning mock products:', products);
    return Promise.resolve(products);
  }

  try {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/v1/products${queryString ? `?${queryString}` : ''}`;
    // ...existing code...
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });
    // ...existing code...
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    const result = await response.json();
    // ...existing code...
    const products = result?.data?.data || result?.data || result;
    // ...existing code...
    return products;
  } catch (error) {
    // ...existing code...
    throw error instanceof Error ? error : new Error('Failed to fetch products');
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string): Promise<Product> {
  if (env.NEXT_PUBLIC_USE_MOCK_DATA && mockProducts) {
    const product = mockProducts.find((p: Product) => p.id === id || p.id === id.toString());
    if (!product) throw new Error('Product not found (mock)');
    return Promise.resolve(product);
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/products/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }
    const result = await response.json();
    // Handle product service response format: { success: true, data: {...} }
    return result?.data || result;
  } catch (error) {
    // Re-throw error for caller to handle
    throw error instanceof Error ? error : new Error('Failed to fetch product');
  }
}
