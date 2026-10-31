import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
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
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Clock,
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
        (err.message === 'Network Error'
          ? 'Cannot connect to backend server. If using Render free tier, the server may be waking up (wait ~30 seconds), or VITE_API_URL is not set in Vercel.'
          : err.message || 'Registration failed. Please verify your details or use a different email.');
      setServerError(message);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-[#172033]">
      {/* Left Form Column */}
      <div className="w-full lg:w-[580px] xl:w-[640px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 shrink-0 border-r border-[#E2E8F0] overflow-y-auto max-h-screen">
        <div>
          {/* Brand */}
          <Link to="/" className="inline-flex items-center space-x-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#1769D2] flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#172033] tracking-tight">RENTORA</span>
              <span className="block text-[10px] text-[#64748B] font-medium tracking-wide">
                ENTERPRISE FEDERATION
              </span>
            </div>
          </Link>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Create an Institutional Account
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Join the verified academic consortium to reserve and share research instruments
            </p>
          </div>

          {/* Error Notice */}
          {serverError && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-2">
                1. Select Account Type <span className="text-[#DC2626]">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {permittedRoles.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setValue('role', item.role)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRole === item.role
                        ? 'border-[#1769D2] bg-[#EFF6FF] ring-1 ring-[#1769D2]'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#172033]">{item.title}</span>
                      {selectedRole === item.role && (
                        <CheckCircle2 className="w-4 h-4 text-[#1769D2]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile Fields */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-3">
              <label className="block text-xs font-semibold text-[#172033]">
                2. Member & Institutional Identity
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Legal Name"
                  placeholder="e.g. Dr. Arun Kumar"
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Institutional Email"
                  type="email"
                  placeholder="e.g. arun@nit.edu"
                  leftIcon={<Mail className="w-4 h-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="University / Institution"
                  placeholder="e.g. National Institute of Technology"
                  leftIcon={<Building className="w-4 h-4" />}
                  error={errors.institution?.message}
                  {...register('institution')}
                />

                <Input
                  label="Department / Faculty"
                  placeholder="e.g. Computer Science & Eng"
                  leftIcon={<GraduationCap className="w-4 h-4" />}
                  error={errors.department?.message}
                  {...register('department')}
                />
              </div>

              <Input
                label="Contact Phone"
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            {/* Credentials */}
            <div className="pt-2 border-t border-[#E2E8F0] space-y-3">
              <label className="block text-xs font-semibold text-[#172033]">
                3. Security Password
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#172033] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
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
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#172033] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
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
              </div>
            </div>

            {/* Institutional Agreement */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2] mt-0.5"
                  {...register('agreeTerms')}
                />
                <span className="text-xs text-[#64748B] leading-relaxed">
                  I accept the{' '}
                  <span className="font-semibold text-[#172033]">
                    Institutional Resource Sharing & Safety Agreement
                  </span>
                  . I agree to comply with laboratory safety protocols, dual-signoff handover inspections, and fair usage quotas.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-xs text-[#DC2626] font-medium mt-1">
                  {errors.agreeTerms.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full mt-3"
            >
              Complete Institutional Registration
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-[#64748B]">
            Already have an active account?{' '}
            <Link to="/login" className="font-semibold text-[#1769D2] hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Team: Storm Breakerz</span>
          <span>Leader: Jaswant Karun S A</span>
        </div>
      </div>

      {/* Right Feature Showcase Column (Split-Screen) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-[#F8FAFC]">
        <div className="max-w-md mx-auto my-auto space-y-8">
          {/* Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#172033]">Verified Academic Federation</h3>
                <p className="text-xs text-[#64748B]">Cross-campus shared research infrastructure</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0] text-xs">
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-medium text-[#172033]">10 Equipment Categories</span>
                <span className="text-[#1769D2] font-semibold text-[11px]">Fully Catalogs</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-medium text-[#172033]">AI Conflict Detection</span>
                <span className="text-[#16834A] font-semibold text-[11px]">Zero Collisions</span>
              </div>
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-medium text-[#172033]">Cryptographic Audit Trail</span>
                <span className="text-[#64748B] font-semibold text-[11px]">SHA-256 Ledger</span>
              </div>
            </div>
          </div>

          {/* Pillars */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#172033]">Democratized High-Value Apparatus</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Eliminate redundant capital grant expenditure by sharing underutilized apparatus with researchers.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#172033]">Transparent Reservation Queues</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Real-time waitlist priorities ensure fair allocation across undergraduate and postgraduate scholars.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-[#64748B]">
          RENTORA Institutional Network • Verified Academic Consortium
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
