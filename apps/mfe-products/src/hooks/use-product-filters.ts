'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/lib/api';

export type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'rating';

export interface FilterState {
  search: string;
  categories: string[];
  priceRange: [number, number];
  minRating: number;
  sortBy: SortOption;
}

export function useProductFilters(products: Product[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    priceRange: [0, 1000],
    minRating: 0,
    sortBy: 'name-asc',
  });

  // Get unique categories from products
  const availableCategories = useMemo(() => {
    const categories = new Set(products.map(p => p.category));
    return Array.from(categories).sort();
  }, [products]);

  // Get price range from products
  const priceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000 };
    const prices = products.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter(p => filters.categories.includes(p.category));
    }

    // Apply price range filter
    result = result.filter(
      p => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Apply rating filter
    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= filters.minRating);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return result;
  }, [products, filters]);

  const updateSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  const updatePriceRange = (priceRange: [number, number]) => {
    setFilters(prev => ({ ...prev, priceRange }));
  };

  const updateMinRating = (minRating: number) => {
    setFilters(prev => ({ ...prev, minRating }));
  };

  const updateSortBy = (sortBy: SortOption) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      priceRange: [priceRange.min, priceRange.max],
      minRating: 0,
      sortBy: 'name-asc',
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.categories.length > 0 ||
    filters.priceRange[0] !== priceRange.min ||
    filters.priceRange[1] !== priceRange.max ||
    filters.minRating > 0;

  return {
    filters,
    filteredProducts,
    availableCategories,
    priceRange,
    updateSearch,
    toggleCategory,
    updatePriceRange,
    updateMinRating,
    updateSortBy,
    clearFilters,
    hasActiveFilters,
  };
}
