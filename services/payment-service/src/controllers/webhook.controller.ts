import { Request, Response } from 'express';
import { stripe } from '../config/stripe';
import { logger, BadRequestError } from '@shopping-app/common';
import { PaymentService } from '../services/payment.service';

export class WebhookController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      logger.error('No stripe signature found in webhook');
      res.status(400).send('No signature');
      return;
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      logger.info('Stripe webhook received', { type: event.type });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.paymentService.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.paymentService.handlePaymentIntentFailed(event.data.object);
          break;

        case 'charge.refunded':
          await this.paymentService.handleChargeRefunded(event.data.object);
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('Webhook error', { error: error.message });
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  };
}
