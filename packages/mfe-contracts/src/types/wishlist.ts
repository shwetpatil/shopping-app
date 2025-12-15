/**
 * Wishlist domain types
 */

import type { Product } from './product';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: string;
  notes?: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  itemCount: number;
  updatedAt: string;
}
