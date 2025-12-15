import { logger } from '@shopping-app/common';
import { kafkaClient, TOPICS } from '../events/kafka';

export class EventPublisher {
  async publishPaymentAuthorized(payment: any) {
    await kafkaClient.publish(TOPICS.PAYMENT_AUTHORIZED, {
      eventType: 'payment.authorized',
      timestamp: new Date().toISOString(),
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
      },
    });

    logger.info('Payment authorized event published', { paymentId: payment.id });
  }

  async publishPaymentFailed(payment: any) {
    await kafkaClient.publish(TOPICS.PAYMENT_FAILED, {
      eventType: 'payment.failed',
      timestamp: new Date().toISOString(),
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: Number(payment.amount),
        errorMessage: payment.errorMessage,
      },
    });

    logger.info('Payment failed event published', { paymentId: payment.id });
  }

  async publishPaymentCaptured(payment: any) {
    await kafkaClient.publish(TOPICS.PAYMENT_CAPTURED, {
      eventType: 'payment.captured',
      timestamp: new Date().toISOString(),
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        amount: Number(payment.amount),
        currency: payment.currency,
      },
    });

    logger.info('Payment captured event published', { paymentId: payment.id });
  }

  async publishPaymentRefunded(payment: any, refundAmount: number) {
    await kafkaClient.publish(TOPICS.PAYMENT_REFUNDED, {
      eventType: 'payment.refunded',
      timestamp: new Date().toISOString(),
      data: {
        paymentId: payment.id,
        orderId: payment.orderId,
        userId: payment.userId,
        refundAmount,
        totalAmount: Number(payment.amount),
        reason: payment.refundReason,
      },
    });

    logger.info('Payment refunded event published', { paymentId: payment.id });
  }
}
