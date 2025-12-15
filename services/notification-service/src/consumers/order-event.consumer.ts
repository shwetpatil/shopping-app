import { logger, OrderPlacedEvent, OrderCancelledEvent, OrderShippedEvent } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';
import { NotificationService } from '../services/notification.service';

export class OrderEventConsumer {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async start() {
    await kafkaClient.subscribe(TOPICS.ORDER_PLACED, async (message) => {
      try {
        const event = message as OrderPlacedEvent;
        logger.info('Received order.placed event', { orderId: event.data.orderId });

        // Send order confirmation email
        await this.notificationService.sendOrderConfirmation({
          userId: event.data.userId,
          email: event.data.userEmail || 'user@example.com', // Get from user service in real scenario
          orderId: event.data.orderId,
          orderNumber: event.data.orderNumber,
          items: event.data.items,
          total: event.data.total,
        });

        logger.info('Order confirmation sent', { orderId: event.data.orderId });
      } catch (error) {
        logger.error('Error processing order.placed event', error);
      }
    });

    await kafkaClient.subscribe(TOPICS.ORDER_CANCELLED, async (message) => {
      try {
        const event = message as OrderCancelledEvent;
        logger.info('Received order.cancelled event', { orderId: event.data.orderId });

        await this.notificationService.sendOrderCancelled({
          userId: event.data.userId,
          email: event.data.userEmail || 'user@example.com',
          orderId: event.data.orderId,
          orderNumber: event.data.orderNumber,
          reason: event.data.reason,
        });

        logger.info('Order cancellation notification sent', { orderId: event.data.orderId });
      } catch (error) {
        logger.error('Error processing order.cancelled event', error);
      }
    });

    await kafkaClient.subscribe(TOPICS.ORDER_SHIPPED, async (message) => {
      try {
        const event = message as OrderShippedEvent;
        logger.info('Received order.shipped event', { orderId: event.data.orderId });

        await this.notificationService.sendOrderShipped({
          userId: event.data.userId,
          email: event.data.userEmail || 'user@example.com',
          orderId: event.data.orderId,
          orderNumber: event.data.orderNumber,
          trackingNumber: event.data.trackingNumber,
        });

        logger.info('Order shipped notification sent', { orderId: event.data.orderId });
      } catch (error) {
        logger.error('Error processing order.shipped event', error);
      }
    });
  }
}
