import { logger, OrderPlacedEvent } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';
import { PaymentService } from '../services/payment.service';

export class OrderEventConsumer {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  async start() {
    await kafkaClient.subscribe(TOPICS.ORDER_PLACED, async (message) => {
      try {
        const event = message as OrderPlacedEvent;
        logger.info('Received order.placed event', { orderId: event.data.orderId });

        // Auto-create payment intent for new orders
        // In real scenario, you might wait for user action
        // This is just to demonstrate event-driven architecture

        logger.info('Order placed, payment intent can be created on-demand', {
          orderId: event.data.orderId,
        });
      } catch (error) {
        logger.error('Error processing order.placed event', error);
      }
    });

    await kafkaClient.subscribe(TOPICS.ORDER_CANCELLED, async (message) => {
      try {
        const event = message as any;
        logger.info('Received order.cancelled event', { orderId: event.data.orderId });

        // Handle payment cancellation/refund if needed
        logger.info('Order cancelled, handle refund if payment was made', {
          orderId: event.data.orderId,
        });
      } catch (error) {
        logger.error('Error processing order.cancelled event', error);
      }
    });
  }
}
