import { logger } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';

export class EventPublisher {
  async publishInventoryReserved(data: {
    orderId: string;
    items: Array<{ productId: string; quantity: number }>;
  }) {
    await kafkaClient.publish(TOPICS.INVENTORY_RESERVED, {
      id: `${data.orderId}-${Date.now()}`,
      timestamp: new Date(),
      type: 'inventory.reserved',
      version: '1',
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
      id: `${data.orderId}-${Date.now()}`,
      timestamp: new Date(),
      type: 'inventory.released',
      version: '1',
      data,
    });

    logger.info('Inventory released event published', { orderId: data.orderId });
  }

  async publishLowStock(inventory: any) {
    await kafkaClient.publish(TOPICS.INVENTORY_LOW_STOCK, {
      id: `${inventory.id}-${Date.now()}`,
      timestamp: new Date(),
      type: 'inventory.low-stock',
      version: '1',
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
