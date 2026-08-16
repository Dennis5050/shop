import { Router } from 'express';
import authRoutes from './v1/auth.routes.js';
import userRoutes from './v1/user.routes.js';
import contactRoutes from './v1/contact.routes.js';
import conversationRoutes from './v1/conversation.routes.js';
import messageRoutes from './v1/message.routes.js';
import groupRoutes from './v1/group.routes.js';
import postRoutes from './v1/post.routes.js';
import commentRoutes from './v1/comment.routes.js';
import notificationRoutes from './v1/notification.routes.js';

const router = Router();

// Mount all v1 sub-routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/contacts', contactRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/groups', groupRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/notifications', notificationRoutes);

export default router;
