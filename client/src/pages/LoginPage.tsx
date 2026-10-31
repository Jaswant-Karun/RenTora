import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import {
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Shield,
  Clock,
  Cpu,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, demoAccounts, switchDemoRole, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Unable to authenticate with provided credentials. Please check your email and password.';
      setServerError(message);
    }
  };

  const handleSelectDemo = (role: string, email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotError(null);
    setForgotSuccessMessage(null);
    setForgotLoading(true);
    try {
      const msg = await forgotPassword(forgotEmail);
      setForgotSuccessMessage(msg);
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message || 'Could not process password recovery request.'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-[#172033]">
      {/* Left Form Column */}
      <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col justify-between p-6 sm:p-10 lg:p-12 shrink-0 border-r border-[#E2E8F0]">
        <div>
          {/* Brand */}
          <Link to="/" className="inline-flex items-center space-x-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-[#1769D2] flex items-center justify-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#172033] tracking-tight">RENTORA</span>
              <span className="block text-[10px] text-[#64748B] font-medium tracking-wide">ENTERPRISE PLATFORM</span>
            </div>
          </Link>

          <div>
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Enter your verified institutional credentials to schedule equipment
            </p>
          </div>

          {/* Quick Demo Selector */}
          <div className="mt-6 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#172033] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" />
                Demo Accounts
              </span>
              <span className="text-[10px] text-[#64748B]">Click to pre-fill</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => handleSelectDemo(demo.role, demo.email, demo.password)}
                  className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E2E8F0] text-left transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#172033]">{demo.name}</span>
                    <Badge role={demo.role} size="sm" />
                  </div>
                  <p className="text-[10px] text-[#64748B] truncate mt-0.5">{demo.email}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Error Notice */}
          {serverError && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <Input
              label="Institutional Email"
              type="email"
              placeholder="e.g. researcher@college.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#172033]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-[#1769D2] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your account password"
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

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                {...register('rememberMe')}
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs text-[#64748B]">
                Remember me on this browser
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-[#64748B]">
            Don't have an institutional profile?{' '}
            <Link to="/register" className="font-semibold text-[#1769D2] hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer Credit */}
        <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Team: Storm Breakerz</span>
          <span>Leader: Jaswant Karun S A</span>
        </div>
      </div>

      {/* Right Feature Showcase Column (Enterprise Split-Screen) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-[#F8FAFC]">
        <div className="max-w-md mx-auto my-auto space-y-8">
          {/* Resource Sharing Illustration Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#172033]">Campus Equipment Sharing</h3>
                <p className="text-xs text-[#64748B]">Federated scientific & lab apparatus</p>
              </div>
            </div>

            {/* Micro visual showing resource scheduling */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#16834A]" />
                  <span className="font-medium text-[#172033]">Rigaku X-Ray Diffractometer</span>
                </div>
                <Badge variant="success" size="sm">Available</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#1769D2]" />
                  <span className="font-medium text-[#172033]">Cleanroom Lithography Suite</span>
                </div>
                <Badge variant="brand" size="sm">Reserved</Badge>
              </div>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#172033]">Role-Based Safety Governance</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Strict credential checks, training verification, and custodian physical handovers.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#172033]">Atomic Conflict Prevention</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Zero double-bookings with fair allocation quotas and transparent waitlists.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-[#64748B]">
          RENTORA Institutional Network • Verified Academic Node
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#172033]">Reset Password</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Enter your institutional email to recover access.</p>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccessMessage ? (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#16834A] space-y-2">
                <p className="font-semibold">{forgotSuccessMessage}</p>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setIsForgotModalOpen(false)}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {forgotError && (
                  <p className="text-xs text-[#DC2626] font-medium">{forgotError}</p>
                )}
                <Input
                  label="Institutional Email"
                  type="email"
                  placeholder="researcher@college.edu"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    type="submit"
                    isLoading={forgotLoading}
                  >
                    Send Recovery Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
