import { Router } from 'express';
import { BFFController } from '../controllers/bff.controller';
import { requireAuth } from '@shopping-app/common';

const router = Router();
const bffController = new BFFController();

// Aggregated endpoints
router.get('/home', bffController.getHomePageData);
router.get('/product/:id', bffController.getProductDetails);
router.get('/user/dashboard', requireAuth, bffController.getUserDashboard);

export default router;
