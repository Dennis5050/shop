import { Router } from 'express';
import { groupController } from '../../controllers/group.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', groupController.createGroup);
router.get('/:id', groupController.getGroup);
router.post('/:id/members', groupController.addMembers);
router.delete('/:id/members/:memberId', groupController.removeMember);
router.post('/:id/leave', groupController.leaveGroup);

export default router;
