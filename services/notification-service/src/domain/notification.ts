import { NotificationType } from '@prisma/client';

export interface SendNotificationDto {
  userId: string;
  type: NotificationType;
  channel: string;
  to?: string;
  subject?: string;
  content: string;
  metadata?: any;
}
