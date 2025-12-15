import { logger, PaymentAuthorizedEvent } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';
import { NotificationService } from '../services/notification.service';

export class PaymentEventConsumer {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async start() {
    await kafkaClient.subscribe(TOPICS.PAYMENT_AUTHORIZED, async (message) => {
      try {
        const event = message as PaymentAuthorizedEvent;
        logger.info('Received payment.authorized event', { paymentId: event.data.paymentId });

        await this.notificationService.sendPaymentConfirmation({
          userId: event.data.userId,
          email: 'user@example.com', // Get from user service
          orderId: event.data.orderId,
          amount: event.data.amount,
        });

        logger.info('Payment confirmation sent', { paymentId: event.data.paymentId });
      } catch (error) {
        logger.error('Error processing payment.authorized event', error);
      }
    });

    await kafkaClient.subscribe(TOPICS.PAYMENT_FAILED, async (message) => {
      try {
        const event = message as any;
        logger.info('Received payment.failed event', { paymentId: event.data.paymentId });

        // Send payment failure notification
        logger.info('Payment failure notification would be sent here', {
          paymentId: event.data.paymentId,
        });
      } catch (error) {
        logger.error('Error processing payment.failed event', error);
      }
    });
  }
}
