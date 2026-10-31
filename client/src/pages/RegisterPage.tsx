import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import {
  User as UserIcon,
  Mail,
  Lock,
  Building,
  GraduationCap,
  AlertCircle,
  Phone,
  Layers,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
} from 'lucide-react';

const registerFormSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(60),
    email: z.string().email('Please enter a valid institutional email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: z.enum(['student', 'owner'] as const),
    institution: z.string().min(2, 'Institution name is required'),
    department: z.string().min(2, 'Department name is required'),
    phone: z.string().min(10, 'Please enter a valid phone number (at least 10 digits)'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the Institutional Resource Sharing Agreement to register.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'student',
      agreeTerms: false,
    },
  });

  const selectedRole = watch('role');

  const permittedRoles = [
    {
      role: 'student' as const,
      title: 'Student / Researcher',
      description: 'Search campus catalogs, request testing rigs, and schedule laboratory time slots.',
    },
    {
      role: 'owner' as const,
      title: 'Lab Custodian / Owner',
      description: 'Catalogue specialized instruments, manage bookings, and sign off on equipment handovers.',
    },
  ];

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerAuth(values);
      navigate('/dashboard');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Registration failed. Please verify your details or use a different email.';
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8 text-[#172033]">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#1769D2] flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-[#172033] tracking-tight">RENTORA</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            Create an Institutional Account
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Join the verified federation to catalogue, reserve, and share scientific equipment
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          {serverError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section 1: Role Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#172033]">
                1. Select Account Type <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permittedRoles.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setValue('role', item.role)}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      selectedRole === item.role
                        ? 'border-[#1769D2] bg-[#EFF6FF] ring-1 ring-[#1769D2]'
                        : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#172033]">{item.title}</span>
                      <Badge role={item.role} size="sm" />
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{item.description}</p>
                  </button>
                ))}
              </div>

              {/* Policy note */}
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2 text-[11px] text-[#64748B]">
                <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
                <span>
                  <strong>Manager & Admin Roles:</strong> University governance accounts require authorization by the campus administration board.
                </span>
              </div>
            </div>

            {/* Section 2: Personal & Academic Affiliation */}
            <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
              <label className="block text-xs font-semibold text-[#172033]">
                2. Personal & Institutional Information
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name"
                  placeholder="e.g. Jaswant Karun"
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Institutional Email"
                  type="email"
                  placeholder="e.g. researcher@college.edu"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Phone Number"
                  placeholder="+91 9876543210"
                  leftIcon={<Phone className="w-4 h-4" />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Input
                  label="Institution"
                  placeholder="e.g. National Institute of Tech"
                  leftIcon={<Building className="w-4 h-4" />}
                  error={errors.institution?.message}
                  {...register('institution')}
                />

                <Input
                  label="Department"
                  placeholder="e.g. Physics / Mechatronics"
                  leftIcon={<GraduationCap className="w-4 h-4" />}
                  error={errors.department?.message}
                  {...register('department')}
                />
              </div>
            </div>

            {/* Section 3: Credentials */}
            <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
              <label className="block text-xs font-semibold text-[#172033]">
                3. Security Credentials
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#64748B] hover:text-[#172033]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[#64748B] hover:text-[#172033]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </div>

            {/* Terms checkbox */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-start">
                <input
                  id="agreeTerms"
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                  {...register('agreeTerms')}
                />
                <label htmlFor="agreeTerms" className="ml-2 text-xs text-[#64748B] leading-relaxed">
                  I agree to the Institutional Resource Sharing Agreement, laboratory safety induction codes, and non-monopolisation guidelines.
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="mt-1 text-xs text-[#DC2626]">{errors.agreeTerms.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full"
            >
              Complete Registration
            </Button>
          </form>

          <p className="text-center text-xs text-[#64748B]">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#1769D2] hover:underline">
              Sign in to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
