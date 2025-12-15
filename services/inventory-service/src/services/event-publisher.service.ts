import { logger } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';

export class EventPublisher {
  async publishInventoryReserved(data: {
    orderId: string;
    productId: string;
    quantity: number;
    reservationId: string;
  }) {
    await kafkaClient.publish(TOPICS.INVENTORY_RESERVED, {
      eventType: 'inventory.reserved',
      timestamp: new Date().toISOString(),
      data,
    });

    logger.info('Inventory reserved event published', { orderId: data.orderId });
  }

  async publishInventoryReleased(data: {
    orderId: string;
    productId: string;
    quantity: number;
  }) {
    await kafkaClient.publish(TOPICS.INVENTORY_RELEASED, {
      eventType: 'inventory.released',
      timestamp: new Date().toISOString(),
      data,
    });

    logger.info('Inventory released event published', { orderId: data.orderId });
  }

  async publishLowStock(inventory: any) {
    await kafkaClient.publish(TOPICS.INVENTORY_LOW_STOCK, {
      eventType: 'inventory.low-stock',
      timestamp: new Date().toISOString(),
      data: {
        inventoryId: inventory.id,
        productId: inventory.productId,
        sku: inventory.sku,
        availableQuantity: inventory.availableQuantity,
        reorderLevel: inventory.reorderLevel,
        reorderQuantity: inventory.reorderQuantity,
      },
    });

    logger.info('Low stock event published', { productId: inventory.productId });
  }
}
