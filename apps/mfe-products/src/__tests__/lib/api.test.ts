/**
 * API Client Tests
 */

import { fetchProducts, fetchProductById } from '../../lib/api';
import { mockProducts } from '../fixtures/products.fixture';

// Mock fetch
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProducts', () => {
    it('fetches products successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await fetchProducts();

      expect(result).toEqual(mockProducts);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products'),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('includes query parameters', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      await fetchProducts({ category: 'electronics', limit: 10 });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=electronics&limit=10'),
        expect.any(Object)
      );
    });

    it('throws error on failed request', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(fetchProducts()).rejects.toThrow('Failed to fetch products');
    });

    it('handles network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchProducts()).rejects.toThrow('Network error');
    });
  });

  describe('fetchProductById', () => {
    it('fetches single product successfully', async () => {
      const product = mockProducts[0];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => product,
      });

      const result = await fetchProductById(product.id);

      expect(result).toEqual(product);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/products/${product.id}`),
        expect.any(Object)
      );
    });

    it('throws error when product not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(fetchProductById('invalid-id')).rejects.toThrow();
    });
  });
});
