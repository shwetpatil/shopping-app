/**
 * Skeleton Loader Components
 * Provides accessible loading states for better UX
 */

import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700',
    none: '',
  };

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{ width, height }}
      role="status"
      aria-label="Loading..."
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * Product Card Skeleton
 */
export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('space-y-3', className)} role="status" aria-label="Loading product">
      {/* Image */}
      <Skeleton variant="rectangular" height={200} />
      
      {/* Title */}
      <Skeleton variant="text" height={24} width="80%" />
      
      {/* Description */}
      <div className="space-y-2">
        <Skeleton variant="text" height={16} width="100%" />
        <Skeleton variant="text" height={16} width="60%" />
      </div>
      
      {/* Price */}
      <Skeleton variant="text" height={20} width="40%" />
      
      {/* Button */}
      <Skeleton variant="rectangular" height={40} />
    </div>
  );
};

/**
 * Product Grid Skeleton
 */
export const ProductGridSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 6, className }) => {
  return (
    <div
      className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

/**
 * Search Bar Skeleton
 */
export const SearchBarSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('space-y-4', className)} role="status" aria-label="Loading search">
      <Skeleton variant="rectangular" height={48} />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height={32} width={80} />
        <Skeleton variant="rectangular" height={32} width={100} />
        <Skeleton variant="rectangular" height={32} width={90} />
      </div>
    </div>
  );
};

/**
 * Cart Summary Skeleton
 */
export const CartSummarySkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={clsx('space-y-4', className)} role="status" aria-label="Loading cart">
      {/* Cart items */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton variant="rectangular" width={80} height={80} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={20} width="70%" />
            <Skeleton variant="text" height={16} width="50%" />
            <Skeleton variant="text" height={18} width="30%" />
          </div>
        </div>
      ))}
      
      {/* Total */}
      <div className="border-t pt-4 space-y-2">
        <Skeleton variant="text" height={24} width="40%" />
        <Skeleton variant="rectangular" height={48} />
      </div>
    </div>
  );
};

/**
 * Reviews List Skeleton
 */
export const ReviewsListSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 3, className }) => {
  return (
    <div className={clsx('space-y-6', className)} role="status" aria-label="Loading reviews">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" height={16} width="30%" />
              <Skeleton variant="text" height={14} width="20%" />
            </div>
          </div>
          
          {/* Rating */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" width={20} height={20} />
            ))}
          </div>
          
          {/* Review text */}
          <div className="space-y-2">
            <Skeleton variant="text" height={16} width="100%" />
            <Skeleton variant="text" height={16} width="90%" />
            <Skeleton variant="text" height={16} width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Wishlist Grid Skeleton
 */
export const WishlistGridSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 4, className }) => {
  return (
    <div
      className={clsx('grid grid-cols-1 md:grid-cols-2 gap-4', className)}
      role="status"
      aria-label="Loading wishlist"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <Skeleton variant="rectangular" width={120} height={120} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" height={20} width="80%" />
            <Skeleton variant="text" height={16} width="60%" />
            <Skeleton variant="text" height={18} width="40%" />
            <Skeleton variant="rectangular" height={36} width="100%" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Table Skeleton
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={clsx('space-y-2', className)} role="status" aria-label="Loading table">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={20} className="flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height={16} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
