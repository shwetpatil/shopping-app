import Stripe from 'stripe';
import { BadRequestError, NotFoundError, logger } from '@shopping-app/common';
import { PaymentRepository } from '../repositories/payment.repository';
import { stripe } from '../config/stripe';
import { CreatePaymentDto } from '../domain/payment';
import { EventPublisher } from './event-publisher.service';

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private eventPublisher: EventPublisher;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.eventPublisher = new EventPublisher();
  }

  async createPaymentIntent(data: CreatePaymentDto) {
    const idempotencyKey = `payment_${data.orderId}_${Date.now()}`;

    // Check idempotency
    const existingLog = await this.paymentRepository.findIdempotencyLog(idempotencyKey);
    if (existingLog) {
      logger.info('Returning cached payment intent', { idempotencyKey });
      return existingLog.responseData;
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency || 'inr',
      metadata: {
        orderId: data.orderId,
        userId: data.userId,
      },
    });

    // Save payment record
    const payment = await this.paymentRepository.createPayment({
      orderId: data.orderId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency || 'INR',
      status: 'PENDING',
      paymentMethod: data.paymentMethod,
      stripePaymentId: paymentIntent.id,
      idempotencyKey,
      metadata: {
        stripeClientSecret: paymentIntent.client_secret,
      },
    });

    const response = {
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
      stripePaymentId: paymentIntent.id,
    };

    // Log idempotency
    await this.paymentRepository.createIdempotencyLog({
      idempotencyKey,
      requestHash: JSON.stringify(data),
      responseData: response,
    });

    logger.info('Payment intent created', { paymentId: payment.id, orderId: data.orderId });

    return response;
  }

  async capturePayment(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findPaymentById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Unauthorized to capture this payment');
    }

    if (payment.status === 'CAPTURED') {
      return payment;
    }

    if (!payment.stripePaymentId) {
      throw new BadRequestError('No Stripe payment intent found');
    }

    // Capture payment with Stripe
    const paymentIntent = await stripe.paymentIntents.capture(payment.stripePaymentId);

    // Update payment status
    const updatedPayment = await this.paymentRepository.updatePaymentStatus(
      paymentId,
      'CAPTURED',
      'Payment captured successfully'
    );

    // Publish event
    await this.eventPublisher.publishPaymentCaptured(updatedPayment);

    logger.info('Payment captured', { paymentId, orderId: payment.orderId });

    return updatedPayment;
  }

  async refundPayment(paymentId: string, userId: string, amount?: number, reason?: string) {
    const payment = await this.paymentRepository.findPaymentById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Unauthorized to refund this payment');
    }

    if (payment.status !== 'CAPTURED') {
      throw new BadRequestError('Only captured payments can be refunded');
    }

    if (!payment.stripePaymentId) {
      throw new BadRequestError('No Stripe payment found');
    }

    const refundAmount = amount || Number(payment.amount);

    // Create refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
    });

    // Update payment
    const updatedPayment = await this.paymentRepository.updatePayment(paymentId, {
      status: refundAmount === Number(payment.amount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      refundAmount,
      refundReason: reason,
    });

    // Publish event
    await this.eventPublisher.publishPaymentRefunded(updatedPayment, refundAmount);

    logger.info('Payment refunded', { paymentId, refundAmount });

    return updatedPayment;
  }

  async getPayment(paymentId: string, userId: string) {
    const payment = await this.paymentRepository.findPaymentById(paymentId);

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Unauthorized to view this payment');
    }

    return payment;
  }

  async getPaymentByOrder(orderId: string, userId: string) {
    const payment = await this.paymentRepository.findPaymentByOrder(orderId);

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== userId) {
      throw new BadRequestError('Unauthorized to view this payment');
    }

    return payment;
  }

  // Webhook handlers
  async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepository.findPaymentByStripeId(paymentIntent.id);

    if (!payment) {
      logger.error('Payment not found for succeeded intent', { stripeId: paymentIntent.id });
      return;
    }

    await this.paymentRepository.updatePaymentStatus(
      payment.id,
      'AUTHORIZED',
      'Payment authorized by Stripe'
    );

    await this.eventPublisher.publishPaymentAuthorized(payment);

    logger.info('Payment authorized via webhook', { paymentId: payment.id });
  }

  async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const payment = await this.paymentRepository.findPaymentByStripeId(paymentIntent.id);

    if (!payment) {
      logger.error('Payment not found for failed intent', { stripeId: paymentIntent.id });
      return;
    }

    await this.paymentRepository.updatePayment(payment.id, {
      status: 'FAILED',
      errorMessage: paymentIntent.last_payment_error?.message || 'Payment failed',
    });

    await this.eventPublisher.publishPaymentFailed(payment);

    logger.info('Payment failed via webhook', { paymentId: payment.id });
  }

  async handleChargeRefunded(charge: Stripe.Charge) {
    logger.info('Charge refunded webhook received', { chargeId: charge.id });
    // Additional refund handling logic if needed
  }
}
