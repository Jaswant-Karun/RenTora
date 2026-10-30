import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Lock, Mail, AlertCircle, Sparkles, Boxes } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, demoAccounts, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

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
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to authenticate. Please check your credentials.';
      setServerError(msg);
    }
  };

  const handleSelectDemo = async (role: any, email: string, pass: string) => {
    setValue('email', email);
    setValue('password', pass);
    setServerError(null);
    try {
      await switchDemoRole(role);
      navigate('/dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-0.5 shadow-lg shadow-brand-500/20 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Boxes className="w-6 h-6 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Welcome back to RENTORA</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access institutional lab equipment, collaborative spaces, and research slots
          </p>
        </div>

        {/* Demo Fast-Login Box */}
        <div className="mb-6 p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brand-300">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span>Hackathon Quick-Sign-In (Instant Access)</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Click any role to test RENTORA's role-based access control instantly:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => handleSelectDemo(demo.role, demo.email, demo.password)}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <Badge role={demo.role} size="sm" />
                </div>
                <p className="text-xs font-semibold text-slate-200 mt-1 truncate">{demo.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{demo.email}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form Card */}
        <Card>
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Institutional Email"
              type="email"
              placeholder="e.g. yourname@college.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign In to RENTORA
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Don't have an institutional account yet?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
