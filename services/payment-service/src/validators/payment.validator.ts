import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid('Invalid order ID'),
    amount: z.number().positive('Amount must be positive'),
    currency: z.string().optional().default('INR'),
    paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD']),
  }),
});

export const capturePaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
  }),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
    amount: z.number().positive('Amount must be positive').optional(),
    reason: z.string().optional(),
  }),
});
