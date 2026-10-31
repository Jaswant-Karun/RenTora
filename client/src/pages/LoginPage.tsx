import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
  Lock,
  Mail,
  AlertCircle,
  Sparkles,
  Boxes,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
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

  const redirectAfterAuth = (userRole?: string) => {
    const from = (location.state as any)?.from?.pathname;
    if (from && from !== '/login' && from !== '/register') {
      navigate(from, { replace: true });
      return;
    }

    // Role-based redirect routing
    switch (userRole) {
      case 'admin':
        navigate('/dashboard?role=admin', { replace: true });
        break;
      case 'manager':
        navigate('/dashboard?role=manager', { replace: true });
        break;
      case 'owner':
        navigate('/dashboard?role=owner', { replace: true });
        break;
      case 'student':
      default:
        navigate('/dashboard?role=student', { replace: true });
        break;
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const loggedInUser = await login(data.email, data.password, data.rememberMe);
      redirectAfterAuth(loggedInUser?.role);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Authentication failed. Please verify your institutional email and password.';
      setServerError(msg);
    }
  };

  const handleSelectDemo = async (role: any, email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
    setServerError(null);
    try {
      const loggedInUser = await switchDemoRole(role);
      redirectAfterAuth(loggedInUser?.role);
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setForgotError(null);
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
    <div className="relative min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] bg-gradient-to-tr from-brand-600/15 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header Branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Boxes className="w-6 h-6 text-brand-400 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          </Link>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Sign In to RENTORA
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Access underutilized spaces, specialized devices, and technical lab equipment safely
          </p>
        </div>

        {/* Quick Demo Personas (1-Click Evaluation) */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Fast Demo Sign-In
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              1-Click Session
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleSelectDemo(demo.role, demo.email, demo.password)}
                className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <Badge role={demo.role} size="sm" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-1.5 truncate group-hover:text-white">
                  {demo.name}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{demo.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Sign-In Card */}
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
            {/* Email Field */}
            <Input
              label="Institutional Email"
              type="email"
              placeholder="e.g. researcher@college.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            {/* Password Field with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>

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

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-1">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-900 cursor-pointer"
                  {...register('rememberMe')}
                />
                <span className="text-xs text-slate-300 font-medium">
                  Remember me on this institutional device
                </span>
              </label>
            </div>

            {/* Sign-In Button */}
            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to RENTORA
            </Button>
          </form>

          {/* Sign-Up Navigation */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              New to the institutional resource network?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                Register as Student or Lab Owner
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setForgotSuccessMessage(null);
                  setForgotError(null);
                }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">Reset Account Password</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Enter your registered institutional email to receive verification credentials.
              </p>

              {forgotSuccessMessage ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Instructions Dispatched</span>
                  </div>
                  <p>{forgotSuccessMessage}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSuccessMessage(null);
                    }}
                  >
                    Return to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  {forgotError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                      {forgotError}
                    </div>
                  )}

                  <Input
                    label="Institutional Email"
                    type="email"
                    placeholder="name@college.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4" />}
                    required
                  />

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsForgotModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={forgotLoading}
                    >
                      Send Reset Instructions
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
