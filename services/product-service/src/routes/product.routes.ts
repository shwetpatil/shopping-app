import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { validate, requireAuth } from '@shopping-app/common';
import {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
} from '../validators/product.validator';

const router = Router();
const productController = new ProductController();

router.get('/', validate(getProductsSchema), productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', requireAuth, validate(createProductSchema), productController.createProduct);
router.put('/:id', requireAuth, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', requireAuth, productController.deleteProduct);

export default router;
