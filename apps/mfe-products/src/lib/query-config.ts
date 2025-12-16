/**
 * TanStack Query (React Query) configuration
 * Centralized query client setup for data fetching, caching, and state management
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh
      staleTime: 5 * 60 * 1000, // 5 minutes
      
      // Cache time: How long inactive data stays in cache
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      
      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus in production
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Refetch on mount if data is stale
      refetchOnMount: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
});

// Query keys factory for type-safe query keys
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.products.lists(), { filters }] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  cart: {
    all: ['cart'] as const,
    detail: (userId?: string) => [...queryKeys.cart.all, userId] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: unknown) => [...queryKeys.orders.lists(), { filters }] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
  },
  user: {
    all: ['user'] as const,
    profile: (id?: string) => [...queryKeys.user.all, 'profile', id] as const,
    wishlist: (id?: string) => [...queryKeys.user.all, 'wishlist', id] as const,
  },
} as const;
