/**
 * Component prop contracts for remote MFE components
 * These define the API each microfrontend exposes
 */

import type { SearchFilters, SearchResult } from '../types/search';
import type { Product } from '../types/product';

// ============================================
// Search MFE Component Props
// ============================================

export interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  onSearch?: (filters: SearchFilters) => void;
  className?: string;
}

export interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  categories?: Array<{ id: string; name: string; count: number }>;
  priceRange?: { min: number; max: number };
  brands?: string[];
  className?: string;
}

// ============================================
// Product MFE Component Props
// ============================================

export interface ProductGridProps {
  filters?: SearchFilters;
  products?: Product[];
  loading?: boolean;
  limit?: number;
  onProductClick?: (product: Product) => void;
  className?: string;
}

export interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  showQuickView?: boolean;
  onAddToCart?: (productId: string) => void;
  onAddToWishlist?: (productId: string) => void;
  className?: string;
}

// ============================================
// Wishlist MFE Component Props
// ============================================

export interface WishlistButtonProps {
  productId: string;
  variant?: 'icon' | 'button' | 'icon-with-count';
  size?: 'sm' | 'md' | 'lg';
  isWishlisted?: boolean;
  onToggle?: (productId: string, isWishlisted: boolean) => void;
  className?: string;
}

export interface WishlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAll?: () => void;
  className?: string;
}

// ============================================
// Review MFE Component Props
// ============================================

export interface ProductReviewsProps {
  productId: string;
  limit?: number;
  sortBy?: 'recent' | 'helpful' | 'rating-high' | 'rating-low';
  allowWrite?: boolean;
  className?: string;
}

export interface ReviewFormProps {
  productId: string;
  onSubmit?: (review: { rating: number; title?: string; comment: string }) => void;
  onCancel?: () => void;
  className?: string;
}

// ============================================
// Cart MFE Component Props
// ============================================

export interface CartSummaryProps {
  variant?: 'mini' | 'full' | 'icon-only';
  showItems?: boolean;
  onCheckout?: () => void;
  onViewCart?: () => void;
  className?: string;
}

export interface CheckoutFlowProps {
  onComplete?: (orderId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
  className?: string;
}
