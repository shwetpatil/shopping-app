import { createKafkaClient } from '@shopping-app/common';

export const kafkaClient = createKafkaClient({
  clientId: process.env.KAFKA_CLIENT_ID || 'payment-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9093').split(','),
  groupId: process.env.KAFKA_GROUP_ID || 'payment-service-group',
});

export const TOPICS = {
  ORDER_PLACED: 'order.placed',
  ORDER_CANCELLED: 'order.cancelled',
  PAYMENT_AUTHORIZED: 'payment.authorized',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_CAPTURED: 'payment.captured',
  PAYMENT_REFUNDED: 'payment.refunded',
};
