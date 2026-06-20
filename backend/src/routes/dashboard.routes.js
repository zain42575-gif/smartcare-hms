import { Router } from 'express';
import { dashboardSummary, appointmentTrend } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';
const router = Router();
router.use(protect);
router.get('/summary', dashboardSummary);
router.get('/appointments-trend', appointmentTrend);
export default router;
