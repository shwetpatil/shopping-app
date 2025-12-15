import { BadRequestError, NotFoundError, logger } from '@shopping-app/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { EmailService } from './email.service';
import { SendNotificationDto } from '../domain/notification';

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private emailService: EmailService;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.emailService = new EmailService();
  }

  async sendNotification(data: SendNotificationDto) {
    // Save notification record
    const notification = await this.notificationRepository.create({
      userId: data.userId,
      type: data.type,
      channel: data.channel,
      subject: data.subject,
      content: data.content,
      metadata: data.metadata,
    });

    try {
      // Send based on type
      if (data.type === 'EMAIL') {
        await this.emailService.sendEmail({
          to: data.to!,
          subject: data.subject!,
          html: data.content,
          metadata: data.metadata,
        });
      }
      // Add SMS/PUSH logic here

      // Update notification status
      await this.notificationRepository.updateStatus(notification.id, 'SENT', new Date());

      logger.info('Notification sent', {
        notificationId: notification.id,
        type: data.type,
        userId: data.userId,
      });

      return notification;
    } catch (error: any) {
      await this.notificationRepository.updateStatus(
        notification.id,
        'FAILED',
        undefined,
        error.message
      );

      logger.error('Failed to send notification', {
        notificationId: notification.id,
        error: error.message,
      });

      throw error;
    }
  }

  async sendOrderConfirmation(data: {
    userId: string;
    email: string;
    orderId: string;
    orderNumber: string;
    items: any[];
    total: number;
  }) {
    const content = await this.emailService.renderTemplate('order-confirmation', {
      orderNumber: data.orderNumber,
      orderId: data.orderId,
      items: data.items,
      total: data.total,
      appUrl: process.env.APP_URL,
      appName: process.env.APP_NAME,
    });

    return this.sendNotification({
      userId: data.userId,
      type: 'EMAIL',
      channel: 'order-confirmation',
      to: data.email,
      subject: `Order Confirmation - ${data.orderNumber}`,
      content,
      metadata: { orderId: data.orderId },
    });
  }

  async sendOrderShipped(data: {
    userId: string;
    email: string;
    orderId: string;
    orderNumber: string;
    trackingNumber?: string;
  }) {
    const content = await this.emailService.renderTemplate('order-shipped', {
      orderNumber: data.orderNumber,
      orderId: data.orderId,
      trackingNumber: data.trackingNumber,
      appUrl: process.env.APP_URL,
      appName: process.env.APP_NAME,
    });

    return this.sendNotification({
      userId: data.userId,
      type: 'EMAIL',
      channel: 'order-shipped',
      to: data.email,
      subject: `Your order has been shipped - ${data.orderNumber}`,
      content,
      metadata: { orderId: data.orderId },
    });
  }

  async sendOrderCancelled(data: {
    userId: string;
    email: string;
    orderId: string;
    orderNumber: string;
    reason?: string;
  }) {
    const content = await this.emailService.renderTemplate('order-cancelled', {
      orderNumber: data.orderNumber,
      orderId: data.orderId,
      reason: data.reason,
      appUrl: process.env.APP_URL,
      appName: process.env.APP_NAME,
    });

    return this.sendNotification({
      userId: data.userId,
      type: 'EMAIL',
      channel: 'order-cancelled',
      to: data.email,
      subject: `Order Cancelled - ${data.orderNumber}`,
      content,
      metadata: { orderId: data.orderId },
    });
  }

  async sendPaymentConfirmation(data: {
    userId: string;
    email: string;
    orderId: string;
    amount: number;
  }) {
    const content = await this.emailService.renderTemplate('payment-confirmation', {
      orderId: data.orderId,
      amount: data.amount,
      appUrl: process.env.APP_URL,
      appName: process.env.APP_NAME,
    });

    return this.sendNotification({
      userId: data.userId,
      type: 'EMAIL',
      channel: 'payment-confirmation',
      to: data.email,
      subject: `Payment Confirmed`,
      content,
      metadata: { orderId: data.orderId, amount: data.amount },
    });
  }

  async sendLowStockAlert(data: {
    productId: string;
    sku: string;
    availableQuantity: number;
    reorderLevel: number;
  }) {
    // Send to admin email or notification system
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@shopping-app.com';

    const content = await this.emailService.renderTemplate('low-stock-alert', {
      sku: data.sku,
      productId: data.productId,
      availableQuantity: data.availableQuantity,
      reorderLevel: data.reorderLevel,
      appUrl: process.env.APP_URL,
    });

    return this.sendNotification({
      userId: 'system',
      type: 'EMAIL',
      channel: 'low-stock-alert',
      to: adminEmail,
      subject: `Low Stock Alert - ${data.sku}`,
      content,
      metadata: { productId: data.productId, sku: data.sku },
    });
  }

  async getNotificationsByUser(
    userId: string,
    page: number,
    limit: number,
    type?: string,
    status?: string
  ) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.notificationRepository.findByUser(
      userId,
      skip,
      limit,
      type,
      status
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllNotifications(page: number, limit: number, type?: string, status?: string) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.notificationRepository.findAll(skip, limit, type, status);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNotification(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new BadRequestError('Unauthorized to view this notification');
    }

    return notification;
  }
}
