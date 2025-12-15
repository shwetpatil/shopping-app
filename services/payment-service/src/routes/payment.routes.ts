import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { validate, requireAuth } from '@shopping-app/common';
import { createPaymentIntentSchema, capturePaymentSchema, refundPaymentSchema } from '../validators/payment.validator';

const router = Router();
const paymentController = new PaymentController();

router.post('/intent', requireAuth, validate(createPaymentIntentSchema), paymentController.createPaymentIntent);
router.post('/capture', requireAuth, validate(capturePaymentSchema), paymentController.capturePayment);
router.post('/refund', requireAuth, validate(refundPaymentSchema), paymentController.refundPayment);
router.get('/:paymentId', requireAuth, paymentController.getPayment);
router.get('/order/:orderId', requireAuth, paymentController.getPaymentByOrder);

export default router;
