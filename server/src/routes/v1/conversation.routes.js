import { Router } from 'express';
import { conversationController } from '../../controllers/conversation.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/private', conversationController.startPrivateConversation);
router.get('/', conversationController.getUserConversations);
router.get('/:id', conversationController.getConversationDetails);

export default router;
