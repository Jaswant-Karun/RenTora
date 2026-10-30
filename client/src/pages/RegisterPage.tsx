import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
  User as UserIcon,
  Mail,
  Lock,
  Building,
  GraduationCap,
  AlertCircle,
  Phone,
  Boxes,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
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
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      institution: '',
      department: '',
      phone: '',
      agreeTerms: false,
    },
  });

  const selectedRole = watch('role');

  const permittedRoles = [
    {
      role: 'student' as const,
      title: 'Student / Researcher',
      description: 'Search, reserve lab spaces & high-value apparatus for projects',
    },
    {
      role: 'owner' as const,
      title: 'Resource / Lab Owner',
      description: 'Catalogue idle equipment, configure slots & review access requests',
    },
  ];

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerAuth(data);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors && err.response.data.errors[0]?.message) ||
        'Registration failed. Please review the highlighted fields.';
      setServerError(msg);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-brand-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Header Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Boxes className="w-6 h-6 text-brand-400 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Your Institutional Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Join the verified federation to catalogue, reserve, and share underused equipment safely
          </p>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-xl bg-slate-900/80 border-slate-800 shadow-2xl">
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">{serverError}</div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Permitted Roles Section */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Your Role <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permittedRoles.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setValue('role', item.role)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selectedRole === item.role
                        ? 'border-brand-500 bg-brand-500/15 ring-1 ring-brand-500 shadow-lg shadow-brand-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-100">{item.title}</span>
                      <Badge role={item.role} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                  </button>
                ))}
              </div>

              {/* Role Governance Policy Note */}
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Manager & Admin Roles:</strong> Institutional governance accounts require direct onboarding by the university administrative board and cannot be created via public sign-up.
                </span>
              </div>
            </div>

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="Dr. / Prof. / Student Name"
                leftIcon={<UserIcon className="w-4 h-4" />}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Institutional Email"
                type="email"
                placeholder="name@university.edu"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Institution & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution / University"
                placeholder="e.g. National Institute of Technology"
                leftIcon={<Building className="w-4 h-4" />}
                error={errors.institution?.message}
                {...register('institution')}
              />

              <Input
                label="Department / Laboratory"
                placeholder="e.g. Robotics & Automation Lab"
                leftIcon={<GraduationCap className="w-4 h-4" />}
                error={errors.department?.message}
                {...register('department')}
              />
            </div>

            {/* Phone Number */}
            <Input
              label="Contact Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              leftIcon={<Phone className="w-4 h-4" />}
              error={errors.phone?.message}
              {...register('phone')}
            />

            {/* Password & Confirm Password with Show/Hide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl border text-sm transition-all duration-200 pl-10 pr-10 py-2.5 focus:outline-none focus:bg-slate-900 ${
                      errors.password
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-rose-400 font-medium pl-1">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Confirm Password
                </label>
                <div className="relative rounded-xl">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl border text-sm transition-all duration-200 pl-10 pr-10 py-2.5 focus:outline-none focus:bg-slate-900 ${
                      errors.confirmPassword
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    }`}
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-rose-400 font-medium pl-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Agree to Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start space-x-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-900 cursor-pointer"
                  {...register('agreeTerms')}
                />
                <span className="text-xs text-slate-300 leading-normal">
                  I agree to the <strong>Institutional Equipment Sharing Treaty</strong>, equipment custody obligations, and safety compliance protocols.
                </span>
              </label>
              {errors.agreeTerms && (
                <p className="text-xs text-rose-400 font-medium pl-7 mt-1">
                  {errors.agreeTerms.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-4"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration & Enter
            </Button>
          </form>

          {/* Sign-In Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an institutional profile?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Sign in to your account
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
