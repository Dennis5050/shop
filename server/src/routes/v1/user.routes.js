import { Router } from 'express';
import { userController } from '../../controllers/user.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/search', userController.searchUsers);
router.get('/profile/:id', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.patch('/settings', userController.updateSettings);
router.post('/block/:id', userController.blockUser);
router.post('/unblock/:id', userController.unblockUser);

export default router;
