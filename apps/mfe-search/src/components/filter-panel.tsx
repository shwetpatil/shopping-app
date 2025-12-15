'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
}

export interface FilterState {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sortBy?: string;
}

const categories = [
  'Electronics',
  'Phones',
  'Computers',
  'Audio',
  'Cameras',
  'Gaming',
  'Wearables',
  'Accessories',
];

const priceRanges = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $250', min: 100, max: 250 },
  { label: '$250 - $500', min: 250, max: 500 },
  { label: '$500+', min: 500, max: 999999 },
];

const ratings = [
  { label: '4 Stars & Up', value: 4 },
  { label: '3 Stars & Up', value: 3 },
  { label: '2 Stars & Up', value: 2 },
  { label: '1 Star & Up', value: 1 },
];

export function FilterPanel({ isOpen, onClose, onApply }: FilterPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  const handleApply = () => {
    const filters: FilterState = {
      sortBy: sortBy !== 'relevance' ? sortBy : undefined,
      category: selectedCategory || undefined,
      rating: selectedRating ? parseInt(selectedRating) : undefined,
    };

    if (selectedPriceRange) {
      const range = priceRanges.find(r => `${r.min}-${r.max}` === selectedPriceRange);
      if (range) {
        filters.minPrice = range.min;
        filters.maxPrice = range.max;
      }
    }

    if (onApply) {
      onApply(filters);
    }
    onClose();
  };

  const handleClear = () => {
    setSelectedCategory('');
    setSelectedPriceRange('');
    setSelectedRating('');
    setSortBy('relevance');
    if (onApply) {
      onApply({});
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Sort By */}
          <div>
            <h3 className="mb-3 font-semibold">Sort By</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 focus:border-blue-600 focus:outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <h3 className="mb-3 font-semibold">Category</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="category"
                    value={category}
                    checked={selectedCategory === category}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="mb-3 font-semibold">Price Range</h3>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <label
                  key={range.label}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    value={`${range.min}-${range.max}`}
                    checked={selectedPriceRange === `${range.min}-${range.max}`}
                    onChange={(e) => setSelectedPriceRange(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="mb-3 font-semibold">Customer Rating</h3>
            <div className="space-y-2">
              {ratings.map((rating) => (
                <label
                  key={rating.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rating"
                    value={rating.value}
                    checked={selectedRating === rating.value.toString()}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="h-4 w-4"
                  />
                  <span>{rating.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 border-t bg-white p-4 flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 rounded-lg border px-4 py-2 hover:bg-gray-50"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
