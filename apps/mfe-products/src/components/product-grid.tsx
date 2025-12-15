'use client';

import { ProductCard } from './product-card';
import type { ProductGridProps } from '@shopping-app/mfe-contracts';
import { useMFEPublish } from '@shopping-app/mfe-contracts';

const sampleProducts = [
  { id: '1', name: 'Wireless Headphones', price: 79.99, imageUrl: '/img1.jpg', rating: 4.5, reviewCount: 256 },
  { id: '2', name: 'Smart Watch', price: 199.99, imageUrl: '/img2.jpg', rating: 4.2, reviewCount: 189 },
  { id: '3', name: 'Laptop Stand', price: 39.99, imageUrl: '/img3.jpg', rating: 4.8, reviewCount: 412 },
  { id: '4', name: 'USB-C Hub', price: 49.99, imageUrl: '/img4.jpg', rating: 4.3, reviewCount: 98 },
];

export function ProductGrid({ onProductClick, products, filters, loading, limit, className }: ProductGridProps) {
  const publishCartAdd = useMFEPublish('cart:add');
  
  const displayProducts = products || sampleProducts;
  const limitedProducts = limit ? displayProducts.slice(0, limit) : displayProducts;

  const handleAddToCart = (productId: string) => {
    // Publish cart:add event
    publishCartAdd({ productId, quantity: 1 });
  };
  if (loading) {
    return <div className={className}>Loading products...</div>;
  }

  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className || ''}`}>
      {limitedProducts.map((product) => (
        <div
          key={product.id}
          onClick={() => onProductClick?.(product as any)}
          className="cursor-pointer"
        >
          <ProductCard product={product} onAddToCart={handleAddToCart} />
        </div>
      ))}
    </div>
  );
}
