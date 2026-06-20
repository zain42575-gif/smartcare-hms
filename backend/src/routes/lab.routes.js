import { Router } from 'express';
import { listLabReports, getLabReportById, createLabReport, updateLabReport } from '../controllers/lab.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { audit } from '../middleware/audit.middleware.js';

const router = Router();

router.use(protect);

router.get('/', listLabReports);
router.get('/:id', getLabReportById);
router.post('/', authorize('admin', 'doctor', 'receptionist', 'lab_technician'), audit('create', 'lab_reports'), createLabReport);
router.patch('/:id', authorize('admin', 'doctor', 'receptionist', 'lab_technician'), audit('update', 'lab_reports'), updateLabReport);

export default router;
