/**
 * Product Query Hooks using TanStack Query
 * Type-safe hooks for fetching and mutating product data
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { fetchProducts, fetchProductById, type Product, type FetchProductsOptions } from '../lib/api';
import { queryKeys } from '../lib/query-config';

/**
 * Hook to fetch all products with optional filtering
 */
export function useProducts(
  options?: FetchProductsOptions,
  queryOptions?: Omit<UseQueryOptions<Product[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.products.list(options),
    queryFn: () => fetchProducts(options),
    ...queryOptions,
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(
  id: string | number,
  queryOptions?: Omit<UseQueryOptions<Product, Error>, 'queryKey' | 'queryFn'>
) {
  const productId = typeof id === 'number' ? id.toString() : id;
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => fetchProductById(productId),
    enabled: !!id, // Only fetch if ID exists
    ...queryOptions,
  });
}

/**
 * Hook to prefetch products (useful for hover/navigation optimization)
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      queryFn: () => fetchProductById(id),
    });
  };
}

/**
 * Hook to get cached product data without fetching
 */
export function useProductCache(id: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<Product>(queryKeys.products.detail(id));
}

/**
 * Hook to invalidate product queries (force refetch)
 */
export function useInvalidateProducts() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() }),
    invalidateDetail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) }),
  };
}

/**
 * Example mutation hook for creating/updating products (if needed in the future)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_newProduct: Partial<Product>) => {
      // Implementation would call API to create product
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}
