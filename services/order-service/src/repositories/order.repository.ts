import { prisma } from '../db/prisma';
import { Order, OrderStatus } from '@prisma/client';
import { CreateOrderData, OrderFilters } from '../domain/order';
import { PaginatedResponse } from '@shopping-app/common';

export class OrderRepository {
  async create(data: CreateOrderData): Promise<Order> {
    return prisma.order.create({
      data: {
        userId: data.userId,
        orderNumber: data.orderNumber,
        status: data.status,
        subtotal: data.subtotal,
        tax: data.tax,
        shippingCost: data.shippingCost,
        totalAmount: data.totalAmount,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        notes: data.notes,
        items: {
          create: data.items,
        },
        statusHistory: {
          create: {
            status: data.status,
            notes: 'Order created',
          },
        },
      },
      include: {
        items: true,
        statusHistory: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByUserId(
    userId: string,
    filters: OrderFilters
  ): Promise<PaginatedResponse<Order>> {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: true,
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatus(orderId: string, status: OrderStatus, notes?: string): Promise<Order> {
    return prisma.order.update({
      where: { id: orderId },
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
        items: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async update(id: string, data: Partial<Order>): Promise<Order> {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        items: true,
        statusHistory: true,
      },
    });
  }
}
