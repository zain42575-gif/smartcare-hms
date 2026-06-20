import { Router } from 'express';
import { listPatients, createPatient, getPatient, updatePatient } from '../controllers/patient.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { audit } from '../middleware/audit.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createPatientSchema, updatePatientSchema } from '../validators/patient.validator.js';

const router = Router();
router.use(protect);
router.get('/', authorize('admin','doctor','receptionist','accountant'), listPatients);
router.post('/', authorize('admin','receptionist'), validate(createPatientSchema), audit('create','patients'), createPatient);
router.get('/:id', authorize('admin','doctor','receptionist','accountant'), getPatient);
router.patch('/:id', authorize('admin','receptionist'), validate(updatePatientSchema), audit('update','patients'), updatePatient);
export default router;
