"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Publicly permitted roles for self-registration: 'student' and 'owner'
exports.registerSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(60),
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: zod_1.z.string().min(6, 'Please confirm your password'),
    role: zod_1.z.enum(['student', 'owner', 'manager', 'admin'], {
        errorMap: () => ({ message: 'Please select a valid role' }),
    }).refine((role) => role === 'student' || role === 'owner', {
        message: 'Administrative and Manager accounts require institutional authorization and cannot be self-registered publicly.',
    }),
    institution: zod_1.z.string().min(2, 'Institution name is required'),
    department: zod_1.z.string().min(2, 'Department name is required'),
    phone: zod_1.z.string().min(10, 'Please enter a valid phone number with at least 10 digits'),
    agreeTerms: zod_1.z.boolean().refine((val) => val === true, {
        message: 'You must agree to the Institutional Resource Sharing Terms & Privacy Policy to proceed.',
    }),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
    rememberMe: zod_1.z.boolean().optional(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Please enter a valid institutional email address'),
});
