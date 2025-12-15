import { prisma } from '../db/prisma';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

interface CreatePaymentData {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  stripePaymentId?: string;
  stripeCustomerId?: string;
  idempotencyKey: string;
  metadata?: any;
}

interface UpdatePaymentData {
  status?: PaymentStatus;
  errorMessage?: string;
  refundAmount?: number;
  refundReason?: string;
}

export class PaymentRepository {
  async createPayment(data: CreatePaymentData) {
    return prisma.payment.create({
      data: {
        ...data,
        statusHistory: {
          create: {
            status: data.status,
            notes: 'Payment created',
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });
  }

  async findPaymentById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findPaymentByOrder(orderId: string) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findPaymentByStripeId(stripePaymentId: string) {
    return prisma.payment.findUnique({
      where: { stripePaymentId },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updatePayment(id: string, data: UpdatePaymentData) {
    return prisma.payment.update({
      where: { id },
      data,
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updatePaymentStatus(id: string, status: PaymentStatus, notes?: string) {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            notes,
          },
        },
      },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findIdempotencyLog(idempotencyKey: string) {
    return prisma.idempotencyLog.findUnique({
      where: { idempotencyKey },
    });
  }

  async createIdempotencyLog(data: {
    idempotencyKey: string;
    requestHash: string;
    responseData: any;
  }) {
    return prisma.idempotencyLog.create({
      data,
    });
  }
}
