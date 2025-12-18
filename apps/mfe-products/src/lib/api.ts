/**
 * Product API client
 * Handles fetching products from backend with proper error handling
 */

import type { Product as ContractProduct } from '@shopping-app/mfe-contracts';
import { SERVICE_PORTS } from '@shopping-app/config';

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
  try {
    const params = new URLSearchParams();
    if (options?.category) params.append('category', options.category);
    if (options?.search) params.append('search', options.search);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/v1/products${queryString ? `?${queryString}` : ''}`;
    
    console.log("[API] Base URL:", API_BASE_URL);
    console.log('[API] Fetching products from:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh data
    });

    console.log('[API] Response status:', response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[API] Response data:', result);
    
    // Handle product service response format: { success: true, data: { data: [...] } }
    const products = result?.data?.data || result?.data || result;
    console.log('[API] Parsed products:', products?.length || 0, 'items');
    
    return products;
  } catch (error) {
    console.error('[API] Fetch error:', error);
    // Re-throw error for caller to handle
    throw error instanceof Error ? error : new Error('Failed to fetch products');
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: string): Promise<Product> {
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
