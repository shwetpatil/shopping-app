import { PaymentMethod } from '@prisma/client';

export interface CreatePaymentDto {
  orderId: string;
  userId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
}
