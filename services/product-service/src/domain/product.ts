export interface CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  price: number;
  sku: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  images?: Array<{
    url: string;
    altText?: string;
    position?: number;
  }>;
}

export interface UpdateProductDto {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  sku?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
}
