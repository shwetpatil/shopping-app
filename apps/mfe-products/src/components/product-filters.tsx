'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SortOption } from '@/hooks/use-product-filters';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  categories: string[];
  availableCategories: string[];
  onCategoryToggle: (category: string) => void;
  priceRange: [number, number];
  maxPrice: number;
  onPriceRangeChange: (range: [number, number]) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  sortBy: SortOption;
  onSortByChange: (sortBy: SortOption) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  resultCount: number;
}

export function ProductFilters({
  search,
  onSearchChange,
  categories,
  availableCategories,
  onCategoryToggle,
  priceRange,
  maxPrice,
  onPriceRangeChange,
  minRating,
  onMinRatingChange,
  sortBy,
  onSortByChange,
  hasActiveFilters,
  onClearFilters,
  resultCount,
}: ProductFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Bar */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {isOpen && (
        <div className="border-t border-gray-200 pt-4 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <XMarkIcon className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="space-y-2">
              {availableCategories.map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={() => onCategoryToggle(category)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range: ${priceRange[0]} - ${priceRange[1]}
            </label>
            <div className="flex gap-4">
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[0]}
                onChange={(e) => onPriceRangeChange([Number(e.target.value), priceRange[1]])}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={priceRange[1]}
                onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value)])}
                className="flex-1"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => onMinRatingChange(rating)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    minRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating === 0 ? 'All' : `${rating}+★`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {resultCount} {resultCount === 1 ? 'product' : 'products'}
      </div>
    </div>
  );
}
