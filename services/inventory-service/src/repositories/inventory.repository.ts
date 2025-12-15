import { prisma } from '../db/prisma';
import { CreateInventoryDto, UpdateInventoryDto } from '../domain/inventory';

export class InventoryRepository {
  async findAll(skip: number, limit: number, lowStock?: boolean) {
    const where = lowStock
      ? {
          availableQuantity: {
            lte: prisma.inventory.fields.reorderLevel,
          },
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.inventory.findUnique({
      where: { id },
      include: {
        reservations: {
          where: { status: 'ACTIVE' },
        },
      },
    });
  }

  async findByProductId(productId: string) {
    return prisma.inventory.findUnique({
      where: { productId },
      include: {
        reservations: {
          where: { status: 'ACTIVE' },
        },
      },
    });
  }

  async create(data: CreateInventoryDto) {
    return prisma.inventory.create({
      data: {
        ...data,
        totalQuantity: data.availableQuantity,
      },
    });
  }

  async update(id: string, data: UpdateInventoryDto) {
    return prisma.inventory.update({
      where: { id },
      data,
    });
  }

  async updateQuantities(id: string, data: Partial<{
    availableQuantity: number;
    reservedQuantity: number;
    totalQuantity: number;
  }>) {
    return prisma.inventory.update({
      where: { id },
      data,
    });
  }

  async adjustStock(
    id: string,
    quantity: number,
    type: string,
    reference?: string,
    notes?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.update({
        where: { id },
        data: {
          availableQuantity: { increment: quantity },
          totalQuantity: { increment: quantity },
        },
      });

      await tx.stockTransaction.create({
        data: {
          inventoryId: id,
          type,
          quantity,
          reference,
          notes,
        },
      });

      return inventory;
    });
  }

  async createReservation(data: {
    inventoryId: string;
    orderId: string;
    userId: string;
    quantity: number;
    expiresAt: Date;
  }) {
    return prisma.stockReservation.create({
      data,
    });
  }

  async findReservationByOrder(orderId: string) {
    return prisma.stockReservation.findUnique({
      where: { orderId },
    });
  }

  async completeReservation(id: string) {
    return prisma.stockReservation.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async cancelReservation(id: string) {
    return prisma.stockReservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  async findExpiredReservations() {
    return prisma.stockReservation.findMany({
      where: {
        status: 'ACTIVE',
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async findTransactions(inventoryId: string, skip: number, limit: number) {
    const [data, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where: { inventoryId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockTransaction.count({
        where: { inventoryId },
      }),
    ]);

    return { data, total };
  }
}
