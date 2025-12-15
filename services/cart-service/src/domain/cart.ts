export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  itemCount: number;
}
