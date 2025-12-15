import { Kafka, Producer, Consumer, EachMessagePayload, KafkaConfig } from 'kafkajs';
import logger from '../logger';
import { DomainEvent } from './index';

export class KafkaClient {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka(config);
  }

  async connectProducer(): Promise<void> {
    if (!this.producer) {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      logger.info('Kafka producer connected');
    }
  }

  async disconnectProducer(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = null;
      logger.info('Kafka producer disconnected');
    }
  }

  async publish(topic: string, event: DomainEvent): Promise<void> {
    if (!this.producer) {
      throw new Error('Producer not connected. Call connectProducer() first.');
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify(event),
            headers: {
              'event-type': event.type,
              'event-version': event.version,
              'correlation-id': event.id,
            },
          },
        ],
      });

      logger.info(`Event published to ${topic}`, {
        eventType: event.type,
        eventId: event.id,
      });
    } catch (error) {
      logger.error('Failed to publish event', { error, event });
      throw error;
    }
  }

  async subscribe(
    groupId: string,
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    const consumer = this.kafka.consumer({ groupId });

    await consumer.connect();
    await consumer.subscribe({ topics, fromBeginning: false });

    await consumer.run({
      eachMessage: async (payload) => {
        try {
          logger.info('Processing message', {
            topic: payload.topic,
            partition: payload.partition,
            offset: payload.message.offset,
          });

          await handler(payload);

          logger.info('Message processed successfully', {
            topic: payload.topic,
            offset: payload.message.offset,
          });
        } catch (error) {
          logger.error('Error processing message', {
            error,
            topic: payload.topic,
            offset: payload.message.offset,
          });
          // In production, implement proper error handling:
          // - Dead letter queue
          // - Retry mechanism
          // - Alert system
        }
      },
    });

    this.consumers.set(groupId, consumer);
    logger.info(`Consumer subscribed to topics: ${topics.join(', ')}`, { groupId });
  }

  async disconnectConsumer(groupId: string): Promise<void> {
    const consumer = this.consumers.get(groupId);
    if (consumer) {
      await consumer.disconnect();
      this.consumers.delete(groupId);
      logger.info(`Consumer disconnected: ${groupId}`);
    }
  }

  async disconnectAll(): Promise<void> {
    await this.disconnectProducer();
    for (const [groupId] of this.consumers) {
      await this.disconnectConsumer(groupId);
    }
  }
}

// Factory function to create Kafka client
export const createKafkaClient = (serviceName: string): KafkaClient => {
  const config: KafkaConfig = {
    clientId: serviceName,
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9093').split(','),
    retry: {
      initialRetryTime: 100,
      retries: 8,
    },
  };

  return new KafkaClient(config);
};
