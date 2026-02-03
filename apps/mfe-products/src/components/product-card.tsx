'use client';

import { Star, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { memo } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (e: React.MouseEvent, productId: string) => void;
}

function ProductCardComponent({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch">
        {/* Image (1/3 left) */}
        <div className="sm:w-1/3 w-full flex-shrink-0 flex items-center">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-200">
            {product.imageUrl ? (
              <Image 
                src={product.imageUrl} 
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
        </div>
        {/* Content (2/3 right) */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="mb-2 font-semibold line-clamp-2">{product.name}</h3>
            {/* Rating */}
            {product.rating && (
              <div className="mb-2 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(product.rating!)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({product.reviewCount || 0})
                </span>
              </div>
            )}
            {/* Price */}
            <p className="mb-4 text-2xl font-bold text-blue-600">
              ${product.price.toFixed(2)}
            </p>
          </div>
          {/* Add to Cart */}
          <button
            onClick={(e) => onAddToCart?.(e, product.id)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ProductCard = memo(ProductCardComponent);
