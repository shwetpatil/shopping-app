import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '@shopping-app/common';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router: Router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

export default router;
