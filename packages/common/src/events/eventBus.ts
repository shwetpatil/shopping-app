import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from './logger';

class EventBus {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private isConnected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: process.env.SERVICE_NAME || 'shopping-app',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9093').split(','),
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer();
    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || `${process.env.SERVICE_NAME}-group`,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      this.isConnected = true;
      logger.info('Kafka event bus connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Kafka', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      await this.consumer.disconnect();
      this.isConnected = false;
      logger.info('Kafka event bus disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Kafka', { error });
      throw error;
    }
  }

  async publish(topic: string, event: any): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Event bus not connected, attempting to publish anyway');
    }

    try {
      const message = {
        key: event.id || Date.now().toString(),
        value: JSON.stringify({
          ...event,
          timestamp: event.timestamp || new Date().toISOString(),
          service: process.env.SERVICE_NAME,
        }),
        headers: {
          'event-type': event.type || topic,
          'correlation-id': event.correlationId || '',
        },
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      logger.info('Event published', {
        topic,
        eventType: event.type,
        eventId: event.id,
      });
    } catch (error) {
      logger.error('Failed to publish event', { topic, error });
      throw error;
    }
  }

  async subscribe(
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    try {
      await this.consumer.subscribe({
        topics,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async (payload) => {
          const { topic, partition, message } = payload;

          logger.info('Event received', {
            topic,
            partition,
            offset: message.offset,
            eventType: message.headers?.['event-type']?.toString(),
          });

          try {
            await handler(payload);
          } catch (error) {
            logger.error('Error handling event', {
              topic,
              partition,
              offset: message.offset,
              error,
            });
            // Implement retry logic or dead letter queue here
          }
        },
      });

      logger.info('Subscribed to topics', { topics });
    } catch (error) {
      logger.error('Failed to subscribe to topics', { topics, error });
      throw error;
    }
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Event types
export enum EventType {
  // Order events
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  ORDER_CANCELLED = 'order.cancelled',

  // Payment events
  PAYMENT_AUTHORIZED = 'payment.authorized',
  PAYMENT_CAPTURED = 'payment.captured',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  // Inventory events
  STOCK_RESERVED = 'stock.reserved',
  STOCK_RELEASED = 'stock.released',
  STOCK_UPDATED = 'stock.updated',

  // Notification events
  NOTIFICATION_SEND = 'notification.send',
}

// Event payload interfaces
export interface OrderCreatedEvent {
  type: EventType.ORDER_CREATED;
  id: string;
  orderId: string;
  userId: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  timestamp: string;
  correlationId?: string;
}

export interface PaymentAuthorizedEvent {
  type: EventType.PAYMENT_AUTHORIZED;
  id: string;
  paymentId: string;
  orderId: string;
  amount: number;
  timestamp: string;
  correlationId?: string;
}

export interface StockReservedEvent {
  type: EventType.STOCK_RESERVED;
  id: string;
  orderId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  timestamp: string;
  correlationId?: string;
}
