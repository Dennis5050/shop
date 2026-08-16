import { Router } from 'express';
import { messageController } from '../../controllers/message.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', messageController.sendMessage);
router.get('/conversation/:conversationId', messageController.getMessages);
router.post('/:id/read', messageController.markRead);
router.post('/:id/reactions', messageController.addReaction);
router.delete('/:id', messageController.deleteMessage);
router.patch('/:id', messageController.editMessage);

export default router;
