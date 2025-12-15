'use client';

import { Star, ShoppingCart } from 'lucide-react';

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
  onAddToCart?: (productId: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-gray-200">
        <div className="flex h-full items-center justify-center text-gray-400">
          {product.imageUrl}
        </div>
      </div>

      {/* Content */}
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

        {/* Add to Cart */}
        <button
          onClick={() => onAddToCart?.(product.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
        >
          <ShoppingCart className="h-5 w-5" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
