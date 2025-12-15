import { OrderPlacedEvent, OrderCancelledEvent, OrderShippedEvent } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';
import { Order, OrderItem } from '@prisma/client';

export class EventPublisher {
  async publishOrderPlaced(order: Order & { items: OrderItem[] }): Promise<void> {
    const event: OrderPlacedEvent = {
      id: order.id,
      timestamp: new Date(),
      type: 'order.placed',
      version: '1.0',
      data: {
        orderId: order.id,
        userId: order.userId,
        items: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: Number(item.price),
        })),
        totalAmount: Number(order.totalAmount),
      },
    };

    await kafkaClient.publish(TOPICS.ORDER_PLACED, event);
  }

  async publishOrderCancelled(order: Order): Promise<void> {
    const event: OrderCancelledEvent = {
      id: `${order.id}-cancelled`,
      timestamp: new Date(),
      type: 'order.cancelled',
      version: '1.0',
      data: {
        orderId: order.id,
        reason: 'User cancelled or system cancelled',
      },
    };

    await kafkaClient.publish(TOPICS.ORDER_CANCELLED, event);
  }

  async publishOrderShipped(order: Order): Promise<void> {
    const event: OrderShippedEvent = {
      id: `${order.id}-shipped`,
      timestamp: new Date(),
      type: 'order.shipped',
      version: '1.0',
      data: {
        orderId: order.id,
        trackingNumber: order.trackingNumber || '',
        carrier: order.carrier || '',
      },
    };

    await kafkaClient.publish(TOPICS.ORDER_SHIPPED, event);
  }
}
