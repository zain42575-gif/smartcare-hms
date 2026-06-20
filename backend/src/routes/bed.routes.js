import { Router } from 'express';
import { listBeds, createBed, updateBed } from '../controllers/bed.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { audit } from '../middleware/audit.middleware.js';

const router = Router();

router.use(protect);
router.get('/', listBeds);
router.post('/', authorize('admin', 'receptionist'), audit('create', 'beds'), createBed);
router.patch('/:id', authorize('admin', 'receptionist'), audit('update', 'beds'), updateBed);

export default router;
