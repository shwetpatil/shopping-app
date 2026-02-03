import { logger, PaymentAuthorizedEvent } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';
import { InventoryService } from '../services/inventory.service';

export class PaymentEventConsumer {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  async start() {
    await kafkaClient.subscribe('inventory-service-group', [TOPICS.PAYMENT_AUTHORIZED], async (payload) => {
      const message = payload.message.value ? JSON.parse(payload.message.value.toString()) : {};
      try {
        const event = message as PaymentAuthorizedEvent;
        logger.info('Received payment.authorized event', { orderId: event.data.orderId });

        // Confirm reservation (deduct from total inventory)
        await this.inventoryService.confirmReservation(event.data.orderId);

        logger.info('Stock reservation confirmed', { orderId: event.data.orderId });
      } catch (error) {
        logger.error('Error processing payment.authorized event', error);
      }
    });

    await kafkaClient.subscribe('inventory-service-group', [TOPICS.PAYMENT_FAILED], async (payload) => {
      const message = payload.message.value ? JSON.parse(payload.message.value.toString()) : {};
      try {
        const event = message as any;
        logger.info('Received payment.failed event', { orderId: event.data.orderId });

        // Release reservation on payment failure
        await this.inventoryService.cancelReservation(event.data.orderId);

        logger.info('Stock reservation released due to payment failure', {
          orderId: event.data.orderId,
        });
      } catch (error) {
        logger.error('Error processing payment.failed event', error);
      }
    });
  }
}
