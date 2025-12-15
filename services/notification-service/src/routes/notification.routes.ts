import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { requireAuth, requireRole } from '@shopping-app/common';

const router = Router();
const notificationController = new NotificationController();

router.get('/', requireAuth, notificationController.getNotifications);
router.get('/:notificationId', requireAuth, notificationController.getNotification);
router.get('/admin/all', requireAuth, requireRole('ADMIN'), notificationController.getAllNotifications);

export default router;
