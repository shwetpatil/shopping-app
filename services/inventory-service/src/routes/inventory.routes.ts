import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { validate, requireAuth, requireRole } from '@shopping-app/common';
import {
  createInventorySchema,
  updateInventorySchema,
  adjustStockSchema,
} from '../validators/inventory.validator';

const router = Router();
const inventoryController = new InventoryController();

router.get('/', requireAuth, requireRole('ADMIN'), inventoryController.getAllInventory);
router.get('/product/:productId', requireAuth, inventoryController.getInventoryByProduct);
router.post('/', requireAuth, requireRole('ADMIN'), validate(createInventorySchema), inventoryController.createInventory);
router.put('/:inventoryId', requireAuth, requireRole('ADMIN'), validate(updateInventorySchema), inventoryController.updateInventory);
router.post('/:inventoryId/adjust', requireAuth, requireRole('ADMIN'), validate(adjustStockSchema), inventoryController.adjustStock);
router.get('/:inventoryId/transactions', requireAuth, requireRole('ADMIN'), inventoryController.getTransactions);

export default router;
