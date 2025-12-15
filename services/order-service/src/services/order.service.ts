import { BadRequestError, NotFoundError, ForbiddenError, logger } from '@shopping-app/common';
import { OrderRepository } from '../repositories/order.repository';
import { ProductService } from './product.service';
import { EventPublisher } from './event-publisher.service';
import { CreateOrderDto, OrderFilters } from '../domain/order';
import { OrderStatus } from '@prisma/client';

export class OrderService {
  private orderRepository: OrderRepository;
  private productService: ProductService;
  private eventPublisher: EventPublisher;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productService = new ProductService();
    this.eventPublisher = new EventPublisher();
  }

  async createOrder(userId: string, data: CreateOrderDto) {
    // Validate products exist and get current prices
    const productIds = data.items.map((item) => item.productId);
    const products = await this.productService.getProductsByIds(productIds);

    if (products.length !== productIds.length) {
      throw new BadRequestError('One or more products not found');
    }

    // Build order items with validated data
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestError(`Product ${item.productId} not found`);
      }

      const price = Number(product.price);
      const subtotal = price * item.quantity;

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price,
        subtotal,
        productData: {
          name: product.name,
          description: product.description,
          image: product.images?.[0]?.url,
        },
      };
    });

    // Calculate totals
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.1; // 10% tax (configure based on region)
    const shippingCost = data.shippingCost || 0;
    const totalAmount = subtotal + tax + shippingCost;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = await this.orderRepository.create({
      userId,
      orderNumber,
      status: OrderStatus.PENDING,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress,
      notes: data.notes,
      items: orderItems,
    });

    // Publish OrderPlaced event
    await this.eventPublisher.publishOrderPlaced(order);

    logger.info('Order created', { orderId: order.id, userId, orderNumber });

    return order;
  }

  async getOrders(userId: string, filters: OrderFilters) {
    return this.orderRepository.findByUserId(userId, filters);
  }

  async getOrderById(id: string, userId: string) {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenError('You do not have access to this order');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, notes?: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status);

    // Update order status
    const updatedOrder = await this.orderRepository.updateStatus(orderId, status, notes);

    // Publish events based on status
    if (status === OrderStatus.SHIPPED) {
      await this.eventPublisher.publishOrderShipped(updatedOrder);
    } else if (status === OrderStatus.CANCELLED) {
      await this.eventPublisher.publishOrderCancelled(updatedOrder);
    }

    logger.info('Order status updated', { orderId, oldStatus: order.status, newStatus: status });

    return updatedOrder;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenError('You do not have access to this order');
    }

    // Only allow cancellation of pending or payment pending orders
    if (![OrderStatus.PENDING, OrderStatus.PAYMENT_PENDING].includes(order.status)) {
      throw new BadRequestError('Order cannot be cancelled at this stage');
    }

    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      OrderStatus.CANCELLED,
      'Cancelled by user'
    );

    await this.eventPublisher.publishOrderCancelled(updatedOrder);

    logger.info('Order cancelled', { orderId, userId });

    return updatedOrder;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus) {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED, OrderStatus.FAILED],
      [OrderStatus.PAYMENT_PENDING]: [OrderStatus.PAID, OrderStatus.FAILED, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.REFUNDED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.FAILED]: [OrderStatus.PENDING],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `ORD${year}${month}${day}${random}`;
  }
}
