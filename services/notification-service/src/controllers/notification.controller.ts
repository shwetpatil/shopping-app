import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, type, status } = req.query;

      const result = await this.notificationService.getNotificationsByUser(
        userId,
        parseInt(page as string),
        parseInt(limit as string),
        type as string,
        status as string
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { notificationId } = req.params;

      const notification = await this.notificationService.getNotification(notificationId, userId);

      res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 50, type, status } = req.query;

      const result = await this.notificationService.getAllNotifications(
        parseInt(page as string),
        parseInt(limit as string),
        type as string,
        status as string
      );

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };
}
