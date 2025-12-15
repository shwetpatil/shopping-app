'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import type { WishlistButtonProps } from '@shopping-app/mfe-contracts';
import { useMFEPublish } from '@shopping-app/mfe-contracts';

export function WishlistButton({ 
  productId, 
  variant = 'icon', 
  size = 'md',
  className = '',
  onToggle,
  isWishlisted = false 
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(isWishlisted);
  const publishWishlistAdd = useMFEPublish('wishlist:add');
  const publishWishlistRemove = useMFEPublish('wishlist:remove');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newState = !isInWishlist;
    setIsInWishlist(newState);
    
    // Publish event
    if (newState) {
      publishWishlistAdd({ productId });
    } else {
      publishWishlistRemove({ productId });
    }
    
    // Also call callback if provided
    if (onToggle) {
      onToggle(productId, newState);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 rounded-lg border px-6 py-3 font-semibold transition-colors ${
          isInWishlist
            ? 'border-red-600 bg-red-50 text-red-600 hover:bg-red-100'
            : 'border-gray-300 hover:bg-gray-50'
        } ${className}`}
      >
        <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-600' : ''}`} />
        <span>{isInWishlist ? 'Saved' : 'Save for Later'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`rounded-lg p-2 transition-colors hover:bg-gray-100 ${className}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`h-6 w-6 ${
          isInWishlist ? 'fill-red-600 text-red-600' : 'text-gray-600'
        }`}
      />
    </button>
  );
}
