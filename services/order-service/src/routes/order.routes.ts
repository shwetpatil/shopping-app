import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { validate, requireAuth } from '@shopping-app/common';
import { createOrderSchema, updateOrderStatusSchema } from '../validators/order.validator';

const router = Router();
const orderController = new OrderController();

// All routes require authentication
router.use(requireAuth);

router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.delete('/:id', orderController.cancelOrder);

export default router;
