import { createKafkaClient } from '@shopping-app/common';

export const kafkaClient = createKafkaClient({
  clientId: process.env.KAFKA_CLIENT_ID || 'inventory-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9093').split(','),
  groupId: process.env.KAFKA_GROUP_ID || 'inventory-service-group',
});

export const TOPICS = {
  ORDER_PLACED: 'order.placed',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_AUTHORIZED: 'payment.authorized',
  PAYMENT_FAILED: 'payment.failed',
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_RELEASED: 'inventory.released',
  INVENTORY_LOW_STOCK: 'inventory.low-stock',
};
