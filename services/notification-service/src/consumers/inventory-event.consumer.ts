import { logger } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';
import { NotificationService } from '../services/notification.service';

export class InventoryEventConsumer {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  async start() {
    await kafkaClient.subscribe(TOPICS.INVENTORY_LOW_STOCK, async (message) => {
      try {
        const event = message as any;
        logger.info('Received inventory.low-stock event', { productId: event.data.productId });

        await this.notificationService.sendLowStockAlert({
          productId: event.data.productId,
          sku: event.data.sku,
          availableQuantity: event.data.availableQuantity,
          reorderLevel: event.data.reorderLevel,
        });

        logger.info('Low stock alert sent', { productId: event.data.productId });
      } catch (error) {
        logger.error('Error processing inventory.low-stock event', error);
      }
    });
  }
}
