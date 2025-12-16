/**
 * Product API client
 * Handles fetching products from backend with proper error handling
 */

import { SERVICE_URLS } from '../../../../config/ports';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || SERVICE_URLS.PRODUCT;

import type { Product as ContractProduct } from '@shopping-app/mfe-contracts';

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
  try {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = `${API_BASE_URL}/api/products${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw error for caller to handle
    throw error instanceof Error ? error : new Error('Failed to fetch products');
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw error for caller to handle
    throw error instanceof Error ? error : new Error('Failed to fetch product');
  }
}
