import { z } from 'zod';

// Publicly permitted roles for self-registration: 'student' and 'owner'
export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: z.enum(['student', 'owner', 'manager', 'admin'], {
      errorMap: () => ({ message: 'Please select a valid role' }),
    }).refine((role) => role === 'student' || role === 'owner', {
      message: 'Administrative and Manager accounts require institutional authorization and cannot be self-registered publicly.',
    }),
    institution: z.string().min(2, 'Institution name is required'),
    department: z.string().min(2, 'Department name is required'),
    phone: z.string().min(10, 'Please enter a valid phone number with at least 10 digits'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Institutional Resource Sharing Terms & Privacy Policy to proceed.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid institutional email address'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
