import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { orderId, amount, currency, paymentMethod } = req.body.body;

      const result = await this.paymentService.createPaymentIntent({
        orderId,
        userId,
        amount,
        currency,
        paymentMethod,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Payment intent created',
      });
    } catch (error) {
      next(error);
    }
  };

  capturePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { paymentId } = req.body.body;

      const payment = await this.paymentService.capturePayment(paymentId, userId);

      res.status(200).json({
        success: true,
        data: payment,
        message: 'Payment captured successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  refundPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { paymentId, amount, reason } = req.body.body;

      const payment = await this.paymentService.refundPayment(paymentId, userId, amount, reason);

      res.status(200).json({
        success: true,
        data: payment,
        message: 'Refund processed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  getPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId } = req.params;
      const userId = req.user!.id;

      const payment = await this.paymentService.getPayment(paymentId, userId);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };

  getPaymentByOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const userId = req.user!.id;

      const payment = await this.paymentService.getPaymentByOrder(orderId, userId);

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };
}
