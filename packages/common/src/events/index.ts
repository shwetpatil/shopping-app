export interface BaseEvent {
  id: string;
  timestamp: Date;
  type: string;
  version: string;
}

export interface OrderPlacedEvent extends BaseEvent {
  type: 'order.placed';
  data: {
    orderId: string;
    orderNumber: string;
    userId: string;
    userEmail?: string;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      price: number;
    }>;
    total: number;
  };
}

export interface PaymentAuthorizedEvent extends BaseEvent {
  type: 'payment.authorized';
  data: {
    orderId: string;
    userId: string;
    paymentId: string;
    amount: number;
  };
}

export interface InventoryReservedEvent extends BaseEvent {
  type: 'inventory.reserved';
  data: {
    orderId: string;
    items: Array<{
      productId: string;
      quantity: number;
    }>;
  };
}

export interface OrderCancelledEvent extends BaseEvent {
  type: 'order.cancelled';
  data: {
    orderId: string;
    orderNumber: string;
    userId: string;
    userEmail?: string;
    reason?: string;
  };
}

export interface OrderShippedEvent extends BaseEvent {
  type: 'order.shipped';
  data: {
    orderId: string;
    orderNumber: string;
    userId: string;
    userEmail?: string;
    trackingNumber?: string;
    carrier?: string;
  };
}

export interface PaymentFailedEvent extends BaseEvent {
  type: 'payment.failed';
  data: {
    orderId: string;
    userId: string;
    paymentId: string;
    amount: number;
    errorMessage?: string;
  };
}

export interface PaymentCapturedEvent extends BaseEvent {
  type: 'payment.captured';
  data: {
    orderId: string;
    userId: string;
    paymentId: string;
    amount: number;
    currency: string;
  };
}

export interface PaymentRefundedEvent extends BaseEvent {
  type: 'payment.refunded';
  data: {
    orderId: string;
    userId: string;
    paymentId: string;
    refundAmount: number;
    totalAmount: number;
    reason?: string;
  };
}

export interface InventoryReleasedEvent extends BaseEvent {
  type: 'inventory.released';
  data: {
    orderId: string;
    productId: string;
    quantity: number;
  };
}

export interface InventoryLowStockEvent extends BaseEvent {
  type: 'inventory.low-stock';
  data: {
    inventoryId: string;
    productId: string;
    sku: string;
    availableQuantity: number;
    reorderLevel: number;
    reorderQuantity: number;
  };
}

export type DomainEvent =
  | OrderPlacedEvent
  | OrderCancelledEvent
  | OrderShippedEvent
  | PaymentAuthorizedEvent
  | PaymentFailedEvent
  | PaymentCapturedEvent
  | PaymentRefundedEvent
  | InventoryReservedEvent
  | InventoryReleasedEvent
  | InventoryLowStockEvent;

export * from './kafka-client';
