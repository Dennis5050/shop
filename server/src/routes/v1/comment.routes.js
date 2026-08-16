import { Router } from 'express';
import { commentController } from '../../controllers/comment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', commentController.addComment);
router.get('/post/:postId', commentController.getComments);
router.delete('/:id', commentController.deleteComment);

export default router;
