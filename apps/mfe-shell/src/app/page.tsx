'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import type { SearchBarProps, ProductGridProps } from '@shopping-app/mfe-contracts';
import { useMFEEvent, useMFEPublish } from '@shopping-app/mfe-contracts';

// Lazy load microfrontend components
// These will be loaded from remote applications at runtime
// Using type-safe props from contracts

const SearchBar = dynamic<SearchBarProps>(() => import('@/components/remote-loaders/search-loader').then(m => m.SearchBar), {
  loading: () => <div className="h-12 bg-gray-200 animate-pulse rounded" />,
  ssr: false,
});

const ProductGrid = dynamic<ProductGridProps>(() => import('@/components/remote-loaders/products-loader').then(m => m.ProductGrid), {
  loading: () => <div className="h-96 bg-gray-200 animate-pulse rounded" />,
  ssr: false,
});

export default function HomePage() {
  // Subscribe to search events from Search MFE
  useMFEEvent('search:filter', (filters) => {
    console.log('[Shell] Search filters changed:', filters);
    // Shell can coordinate between MFEs based on search
  });

  // Subscribe to cart events
  useMFEEvent('cart:add', (payload) => {
    console.log('[Shell] Product added to cart:', payload);
    // Show notification, update cart count, etc.
  });

  // Publish function for search
  const publishSearch = useMFEPublish('search:filter');

  const handleSearch = (filters: any) => {
    // Publish search event to all interested MFEs
    publishSearch(filters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Our Microfrontend Shopping App
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Built with independently deployable modules for scalability and team autonomy
        </p>
        
        {/* Search Module (Remote) - Using type-safe props */}
        <Suspense fallback={<div>Loading search...</div>}>
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Search products..."
          />
        </Suspense>
      </section>

      {/* Featured Products */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Featured Products</h2>
        
        {/* Products Module (Remote) */}
        <Suspense fallback={<div>Loading products...</div>}>
          <ProductGrid />
        </Suspense>
      </section>

      {/* Architecture Info */}
      <section className="bg-blue-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold mb-4">Microfrontend Architecture</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">🔍 Search MFE</h3>
            <p className="text-sm text-gray-600">Port 3001 - Independent search module</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">🛍️ Products MFE</h3>
            <p className="text-sm text-gray-600">Port 3004 - Product catalog module</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">❤️ Wishlist MFE</h3>
            <p className="text-sm text-gray-600">Port 3002 - Wishlist management</p>
          </div>
        </div>
      </section>
    </div>
  );
}
