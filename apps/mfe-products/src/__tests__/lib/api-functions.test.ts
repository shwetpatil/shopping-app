/**
 * Product API Functions Tests
 * Tests the API layer for fetching products
 */

import { fetchProducts, fetchProductById } from '../../lib/api';

// Mock fetch
global.fetch = jest.fn();

describe('Product API', () => {
  const mockProducts = [
    { id: '1', name: 'Product 1', price: 10, imageUrl: 'test.jpg', rating: 4, reviewCount: 10 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchProducts', () => {
    it('returns products on successful fetch', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts,
      });

      const result = await fetchProducts();

      expect(result).toEqual(mockProducts);
      expect(fetch).toHaveBeenCalled();
    });

    it('throws error when fetch fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(fetchProducts()).rejects.toThrow();
    });
  });

  describe('fetchProductById', () => {
    it('returns single product on successful fetch', async () => {
      const product = mockProducts[0];
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => product,
      });

      const result = await fetchProductById(product.id);

      expect(result).toEqual(product);
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
