import { Router } from 'express';
import { listAdmissions, admitPatient, dischargePatient } from '../controllers/admission.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { audit } from '../middleware/audit.middleware.js';

const router = Router();

router.use(protect);
router.get('/', authorize('admin', 'doctor', 'receptionist', 'accountant', 'patient'), listAdmissions);
router.post('/', authorize('admin', 'receptionist'), audit('create', 'admissions'), admitPatient);
router.post('/:id/discharge', authorize('admin', 'receptionist'), audit('update', 'admissions'), dischargePatient);

export default router;
