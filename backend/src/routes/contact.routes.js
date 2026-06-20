import { Router } from 'express';
import { createMessage, listMessages, markMessageRead, deleteMessage } from '../controllers/contact.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Public route to submit messages
router.post('/', createMessage);

// Protected admin routes
router.use(protect, authorize('admin'));
router.get('/', listMessages);
router.patch('/:id/read', markMessageRead);
router.delete('/:id', deleteMessage);

export default router;
