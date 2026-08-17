import { Router } from 'express';
import { mediaController } from '../../controllers/media.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/upload', mediaController.uploadMedia);

export default router;
