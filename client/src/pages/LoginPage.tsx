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
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Users,
  Building,
  ShieldCheck,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, demoModeEnabled, demoAccounts, switchDemoRole, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [instantLoggingIn, setInstantLoggingIn] = useState<string | null>(null);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Evaluator accounts strictly populated from server when demo mode is enabled
  const activeDemoAccounts = demoModeEnabled && Array.isArray(demoAccounts) ? demoAccounts : [];

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
        (err.message === 'Network Error'
          ? 'Cannot connect to backend server. If using Render free tier, the server may be waking up (wait ~30 seconds), or VITE_API_URL is not set in Vercel.'
          : err.message || 'Unable to authenticate with provided credentials. Please check your email and password.');
      setServerError(message);
    }
  };

  const handleSelectDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  const handleCopy = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInstantLogin = async (role: any) => {
    setInstantLoggingIn(role);
    setServerError(null);
    try {
      await switchDemoRole(role);
      navigate(
        role === 'admin'
          ? '/admin'
          : role === 'manager'
          ? '/manager'
          : role === 'owner'
          ? '/owner'
          : '/dashboard'
      );
    } catch (err: any) {
      setServerError(err.message || 'Instant login failed. Please sign in with email and password.');
    } finally {
      setInstantLoggingIn(null);
    }
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
    <div className="min-h-screen w-full flex flex-col bg-white text-[#172033]">
      {/* Top Evaluator Sandbox Banner (Rendered only when server-controlled demo mode is enabled) */}
      {demoModeEnabled && activeDemoAccounts.length > 0 && (
        <div className="w-full bg-[#172033] text-white px-4 sm:px-6 py-2.5 text-xs border-b border-slate-700">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#1769D2] font-bold text-[10px] uppercase tracking-wider text-white">
                Evaluator Sandbox
              </span>
              <span className="text-slate-300 font-medium">
                Demonstration Environment Active • Safe Fictional Institutional Data
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 hidden lg:inline">Quick Launch:</span>
              {activeDemoAccounts.map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => handleInstantLogin(demo.role)}
                  disabled={instantLoggingIn !== null}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-semibold transition-colors disabled:opacity-50"
                >
                  {demo.roleLabel.split('/')[0].trim()} ({demo.name.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 w-full flex">
        {/* Left Form Column */}
        <div className="w-full lg:w-[500px] xl:w-[580px] flex flex-col justify-between p-6 sm:p-8 lg:p-10 shrink-0 border-r border-[#E2E8F0]">
          <div>
            {/* Brand */}
            <Link to="/" className="inline-flex items-center space-x-2.5 mb-6">
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
                Enter your verified institutional credentials{demoModeEnabled && activeDemoAccounts.length > 0 ? ' or select an evaluator account below' : ''}
              </p>
            </div>

            {/* Evaluator Demo Credentials Card (Only if server demo mode is enabled) */}
            {demoModeEnabled && activeDemoAccounts.length > 0 && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-[#1769D2]/25 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#1769D2]" />
                    <span className="text-xs font-bold text-[#172033]">
                      Evaluator Demo Accounts
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0] font-medium">
                    Sandbox Active
                  </span>
                </div>

                {/* Persona Cards with Auto-Fill & 1-Click Action */}
                <div className="space-y-2">
                  {activeDemoAccounts.map((demo) => {
                    const pass = demo.password || '';
                    const isBusy = instantLoggingIn === demo.role;

                    return (
                      <div
                        key={demo.role}
                        className="p-2.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#1769D2]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#172033]">{demo.name}</span>
                            <Badge role={demo.role as any} size="sm" />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] font-mono text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <span className="text-slate-400">Email:</span>
                              <span className="text-slate-800 font-semibold select-all">{demo.email}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(demo.email, `email-${demo.role}`, e)}
                                className="text-[#64748B] hover:text-[#1769D2] p-0.5"
                                title="Copy email"
                              >
                                {copiedKey === `email-${demo.role}` ? (
                                  <Check className="w-3 h-3 text-[#16834A]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleSelectDemo(demo.email, pass)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#1769D2] bg-blue-50/80 hover:bg-blue-100/80 rounded-md border border-blue-200 transition-colors"
                            title="Fill credentials into form"
                          >
                            Auto-Fill
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInstantLogin(demo.role)}
                            disabled={instantLoggingIn !== null}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] rounded-md shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {isBusy ? 'Authenticating...' : '1-Click Login'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Notice */}
            {serverError && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-[#DC2626]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3.5">
              <Input
                label="Institutional Email Address"
                type="email"
                placeholder="e.g. student@rentora.edu"
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
                    placeholder="Enter password (e.g. Password123!)"
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
                  Remember session on this device
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="w-full mt-2"
              >
                Sign In With Credentials
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-[#64748B]">
              New campus researcher?{' '}
              <Link to="/register" className="font-semibold text-[#1769D2] hover:underline">
                Create institutional account
              </Link>
            </p>
          </div>

          {/* Footer Credit */}
          <div className="pt-5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
            <span>Team: Storm Breakerz</span>
            <span>Lead: Jaswant Karun S A</span>
          </div>
        </div>

        {/* Right Feature Showcase Column (Enterprise Split-Screen) */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-10 xl:p-12 bg-[#F8FAFC]">
          <div className="max-w-lg mx-auto my-auto space-y-6">
            {/* Quick Demo Credentials Cheat Sheet Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">Evaluator Credentials Cheat Sheet</h3>
                    <p className="text-xs text-[#64748B]">Pre-seeded accounts with complete sample data</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  Verified Active
                </span>
              </div>

              {/* Table of Demo Accounts */}
              <div className="overflow-hidden border border-[#E2E8F0] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] border-b border-[#E2E8F0]">
                    <tr>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Email Address</th>
                      <th className="py-2.5 px-3">Password</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-[11px]">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <Badge role="student" size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                        student@rentora.edu
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                        Password123!
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleInstantLogin('student')}
                          className="text-[#1769D2] hover:underline font-bold"
                        >
                          Launch ➔
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <Badge role="owner" size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                        owner@rentora.edu
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                        Password123!
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleInstantLogin('owner')}
                          className="text-[#1769D2] hover:underline font-bold"
                        >
                          Launch ➔
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <Badge role="manager" size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                        manager@rentora.edu
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                        Password123!
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleInstantLogin('manager')}
                          className="text-[#1769D2] hover:underline font-bold"
                        >
                          Launch ➔
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <Badge role="admin" size="sm" />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                        admin@rentora.edu
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                        Password123!
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleInstantLogin('admin')}
                          className="text-[#1769D2] hover:underline font-bold"
                        >
                          Launch ➔
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
                <span>Safe simulated institutional data only</span>
                <button
                  type="button"
                  onClick={(e) => handleCopy('Password123!', 'cheat-sheet-pass', e)}
                  className="text-[#1769D2] hover:underline flex items-center gap-1 font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedKey === 'cheat-sheet-pass' ? 'Copied Password!' : 'Copy Password (Password123!)'}</span>
                </button>
              </div>
            </div>

            {/* Features summary */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0]">
                <ShieldCheck className="w-4 h-4 text-[#16834A] mb-1.5" />
                <h4 className="font-bold text-[#172033]">Cryptographic TrustPass</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">QR token custody verification at physical apparatus check-in.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0]">
                <Clock className="w-4 h-4 text-[#1769D2] mb-1.5" />
                <h4 className="font-bold text-[#172033]">FairShare Engine</h4>
                <p className="text-[11px] text-[#64748B] mt-0.5">Transparent priority scoring and standby waitlist queue.</p>
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-[#64748B]">
            RENTORA Institutional Network • Verified Academic Node
          </div>
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
                    type="button"
                    variant="outline"
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
