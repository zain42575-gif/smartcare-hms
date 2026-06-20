import { z } from 'zod';

export const createPatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
    dateOfBirth: z.string().optional(),
    cnic: z.string().optional(),
    phone: z.string().min(5, 'Phone is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.string().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
    allergies: z.array(z.string()).optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      relation: z.string().optional(),
      phone: z.string().optional()
    }).optional()
  }),
});

export const updatePatientSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    dateOfBirth: z.string().optional(),
    cnic: z.string().optional(),
    phone: z.string().min(5).optional(),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    address: z.string().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
    allergies: z.array(z.string()).optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      relation: z.string().optional(),
      phone: z.string().optional()
    }).optional()
  }),
});
