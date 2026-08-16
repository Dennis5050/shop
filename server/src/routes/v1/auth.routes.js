import { Router } from 'express';
import { authController } from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected
router.get('/me', authenticate, authController.getMe);
router.post('/password', authenticate, authController.changePassword);

export default router;
