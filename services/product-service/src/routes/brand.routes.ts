import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { requireAuth } from '@shopping-app/common';

const router = Router();
const brandController = new BrandController();

router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrandById);
router.post('/', requireAuth, brandController.createBrand);
router.put('/:id', requireAuth, brandController.updateBrand);
router.delete('/:id', requireAuth, brandController.deleteBrand);

export default router;
