/**
 * Product domain types
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  imageUrl: string;
  images?: string[];
  category: string;
  categoryId: string;
  brand?: string;
  stock: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  tags?: string[];
  attributes?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  productCount: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}
