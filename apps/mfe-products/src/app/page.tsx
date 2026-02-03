'use client';

import { useProducts } from '../hooks/use-product-queries';
import { useState, useMemo } from 'react';
import { ProductGrid } from '../components/product-grid';
import { ProductFilters } from '../components/product-filters';
import type { SortOption } from '../hooks/use-product-filters';

export default function ProductsPage() {
  // Filter state
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Fetch products
  const { data: products = [], isLoading, error } = useProducts();

  // Compute available categories and max price
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return cats;
  }, [products]);
  const maxPrice = useMemo(() => Math.max(200, ...products.map((p) => p.price)), [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) =>
        (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())) &&
        (categories.length === 0 || categories.includes(p.category)) &&
        p.price >= priceRange[0] && p.price <= priceRange[1] &&
        (minRating === 0 || (p.rating ?? 0) >= minRating)
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'name-desc': return b.name.localeCompare(a.name);
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          case 'rating': return (b.rating ?? 0) - (a.rating ?? 0);
          default: return 0;
        }
      });
  }, [products, search, categories, priceRange, minRating, sortBy]);

  const handleCategoryToggle = (cat: string) => {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };
  const handleClearFilters = () => {
    setSearch('');
    setCategories([]);
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setSortBy('name-asc');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="h-[60px] bg-blue-600 flex items-center px-6 shadow">
        <h1 className="text-2xl font-bold text-white">Browse Products</h1>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          categories={categories}
          availableCategories={availableCategories}
          onCategoryToggle={handleCategoryToggle}
          priceRange={priceRange}
          maxPrice={maxPrice}
          onPriceRangeChange={setPriceRange}
          minRating={minRating}
          onMinRatingChange={setMinRating}
          sortBy={sortBy as SortOption}
          onSortByChange={setSortBy}
          hasActiveFilters={!!search || categories.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice || minRating > 0}
          onClearFilters={handleClearFilters}
          resultCount={filteredProducts.length}
        />
        <ProductGrid products={filteredProducts} loading={isLoading} />
        {error && <div className="text-red-500 mt-4">Failed to load products.</div>}
      </main>
    </div>
  );
}
