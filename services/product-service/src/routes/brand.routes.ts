import { Router } from 'express';
import { BrandController } from '../controllers/brand.controller';
import { validate, requireAuth } from '@shopping-app/common';
import {
  createBrandSchema,
  updateBrandSchema,
  getBrandsSchema,
} from '../validators/brand.validator';

const router = Router();
const brandController = new BrandController();

router.get('/', validate(getBrandsSchema), brandController.getBrands);
router.get('/:id', brandController.getBrandById);
router.post('/', requireAuth, validate(createBrandSchema), brandController.createBrand);
router.put('/:id', requireAuth, validate(updateBrandSchema), brandController.updateBrand);
router.delete('/:id', requireAuth, brandController.deleteBrand);

export default router;
