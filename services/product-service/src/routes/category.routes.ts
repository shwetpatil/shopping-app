import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { validate, requireAuth, CachePresets } from '@shopping-app/common';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
} from '../validators/category.validator';

const router = Router();
const categoryController = new CategoryController();

router.get('/', CachePresets.longTerm(), validate(getCategoriesSchema), categoryController.getCategories);
router.get('/:id', CachePresets.longTerm(), categoryController.getCategoryById);
router.post('/', requireAuth, validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', requireAuth, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', requireAuth, categoryController.deleteCategory);

export default router;
