import { logger, OrderPlacedEvent } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';
import { InventoryService } from '../services/inventory.service';

export class OrderEventConsumer {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  async start() {
    await kafkaClient.subscribe('inventory-service-group', [TOPICS.ORDER_PLACED], async (payload) => {
      const message = payload.message.value ? JSON.parse(payload.message.value.toString()) : {};
      try {
        const event = message as OrderPlacedEvent;
        logger.info('Received order.placed event', { orderId: event.data.orderId });

        // Reserve stock for order items
        for (const item of event.data.items) {
          await this.inventoryService.reserveStock(
            item.productId,
            event.data.orderId,
            event.data.userId,
            item.quantity
          );
        }

        logger.info('Stock reserved for order', { orderId: event.data.orderId });
      } catch (error) {
        logger.error('Error processing order.placed event', error);
      }
    });

    await kafkaClient.subscribe('inventory-service-group', [TOPICS.ORDER_CANCELLED], async (payload) => {
      const message = payload.message.value ? JSON.parse(payload.message.value.toString()) : {};
      try {
        const event = message as any;
        logger.info('Received order.cancelled event', { orderId: event.data.orderId });

        await this.inventoryService.cancelReservation(event.data.orderId);

        logger.info('Stock reservation cancelled', { orderId: event.data.orderId });
      } catch (error) {
        logger.error('Error processing order.cancelled event', error);
      }
    });
  }
}
