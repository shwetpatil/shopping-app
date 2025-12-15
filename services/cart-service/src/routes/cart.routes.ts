import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { validate, requireAuth } from '@shopping-app/common';
import { addToCartSchema, updateCartItemSchema } from '../validators/cart.validator';

const router = Router();
const cartController = new CartController();

router.get('/', requireAuth, cartController.getCart);
router.post('/items', requireAuth, validate(addToCartSchema), cartController.addItem);
router.put('/items/:productId', requireAuth, validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:productId', requireAuth, cartController.removeItem);
router.delete('/', requireAuth, cartController.clearCart);
router.post('/merge', requireAuth, cartController.mergeGuestCart);

export default router;
