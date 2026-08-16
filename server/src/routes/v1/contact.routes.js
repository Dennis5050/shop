import { Router } from 'express';
import { contactController } from '../../controllers/contact.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', contactController.addContact);
router.get('/', contactController.getContacts);
router.delete('/:id', contactController.removeContact);

export default router;
