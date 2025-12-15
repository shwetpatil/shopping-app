import { OrderStatus } from '@prisma/client';

export interface CreateOrderDto {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    fullName: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  shippingCost?: number;
  notes?: string;
}

export interface CreateOrderData {
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: any;
  billingAddress?: any;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    subtotal: number;
    productData?: any;
  }>;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
}
