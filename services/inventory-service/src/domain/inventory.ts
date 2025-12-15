export interface CreateInventoryDto {
  productId: string;
  sku: string;
  availableQuantity: number;
  reorderLevel?: number;
  reorderQuantity?: number;
}

export interface UpdateInventoryDto {
  reorderLevel?: number;
  reorderQuantity?: number;
}
