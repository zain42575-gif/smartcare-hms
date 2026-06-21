import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, registerPatient, registerDoctorRequest, googleLogin, me, updatePassword, refresh, logout, generate2fa, enable2fa, verify2faLogin } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { loginSchema, registerPatientSchema, registerDoctorSchema } from '../validators/auth.validator.js';

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === 'production' ? 10 : 100,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const router = Router();
router.post('/login', strictLimiter, validate(loginSchema), login);
router.post('/register-patient', standardLimiter, validate(registerPatientSchema), registerPatient);
router.post('/register-doctor', standardLimiter, validate(registerDoctorSchema), registerDoctorRequest);
router.post('/google', strictLimiter, googleLogin);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, me);
router.patch('/password', protect, strictLimiter, updatePassword);

router.post('/2fa/generate', protect, generate2fa);
router.post('/2fa/enable', protect, strictLimiter, enable2fa);
router.post('/2fa/verify', strictLimiter, verify2faLogin);

export default router;
