import { createKafkaClient } from '@shopping-app/common';

export const kafkaClient = createKafkaClient(process.env.SERVICE_NAME || 'order-service');

// Kafka topics
export const TOPICS = {
  ORDER_PLACED: 'order.placed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_SHIPPED: 'order.shipped',
  PAYMENT_AUTHORIZED: 'payment.authorized',
  INVENTORY_RESERVED: 'inventory.reserved',
};
