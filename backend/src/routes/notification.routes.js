import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
router.use(protect);
router.get('/', listNotifications);
router.patch('/read', markRead);
export default router;
