'use client';

import { ProductCard } from './product-card';
import type { ProductGridProps } from '@shopping-app/mfe-contracts';
import { useMFEPublish } from '@shopping-app/mfe-contracts';
import { useQueryClient } from '@tanstack/react-query';
import { fetchProductById } from '../lib/api';

export function ProductGrid({ onProductClick, products = [], filters: _filters, loading, limit, className }: ProductGridProps) {
  const publishCartAdd = useMFEPublish('cart:add');
  const queryClient = useQueryClient();
  
  const displayProducts = products;
  const limitedProducts = limit ? displayProducts.slice(0, limit) : displayProducts;
  
  // Prefetch product details on hover
  const handleProductHover = (productId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: () => fetchProductById(productId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Prevent triggering product click
    publishCartAdd({ productId, quantity: 1 });
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className || ''}`}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-4 aspect-square rounded-lg bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayProducts.length === 0) {
    return (
      <div className={`text-center py-12 ${className || ''}`}>
        <p className="text-gray-500 text-lg">No products found</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className || ''}`}>
      {limitedProducts.map((product) => (
        <div
          key={product.id}
          onClick={() => onProductClick?.(product)}
          onKeyDown={(e) => e.key === 'Enter' && onProductClick?.(product)}
          onMouseEnter={() => handleProductHover(product.id)}
          role="button"
          tabIndex={0}
          className="cursor-pointer"
        >
          <ProductCard product={product} onAddToCart={handleAddToCart} />
        </div>
      ))}
    </div>
  );
}
