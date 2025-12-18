export interface CreateBrandDto {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive?: boolean;
}

export interface UpdateBrandDto {
  name?: string;
  slug?: string;
  description?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  isActive?: boolean;
}

export interface BrandFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
