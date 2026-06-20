import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.string({ required_error: 'Role is required' }),
  }),
});

export const registerPatientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(5, 'Phone number is required'),
    address: z.string().optional(),
    gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
    bloodGroup: z.string().optional()
  }),
});

export const registerDoctorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().min(5, 'Phone number is required'),
    specialization: z.string().min(2, 'Specialization is required'),
    department: z.string().min(2, 'Department is required'),
    consultationFee: z.coerce.number().min(0),
    qualification: z.string().optional()
  }),
});
