import { Router } from 'express';
import { postController } from '../../controllers/post.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', postController.createPost);
router.get('/feed', postController.getFeed);
router.post('/:id/like', postController.likePost);
router.delete('/:id', postController.deletePost);

export default router;
