import { prisma } from '../db/prisma';
import { NotificationType, NotificationStatus } from '@prisma/client';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  channel: string;
  subject?: string;
  content: string;
  metadata?: any;
}

export class NotificationRepository {
  async create(data: CreateNotificationData) {
    return prisma.notification.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  async findByUser(
    userId: string,
    skip: number,
    limit: number,
    type?: string,
    status?: string
  ) {
    const where: any = { userId };

    if (type) {
      where.type = type as NotificationType;
    }

    if (status) {
      where.status = status as NotificationStatus;
    }

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  async findAll(skip: number, limit: number, type?: string, status?: string) {
    const where: any = {};

    if (type) {
      where.type = type as NotificationType;
    }

    if (status) {
      where.status = status as NotificationStatus;
    }

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    sentAt?: Date,
    errorMessage?: string
  ) {
    return prisma.notification.update({
      where: { id },
      data: {
        status,
        sentAt,
        errorMessage,
        updatedAt: new Date(),
      },
    });
  }
}
