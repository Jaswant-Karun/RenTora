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
import { UserRole } from '../types/auth';
import {
  User as UserIcon,
  Mail,
  Lock,
  Building,
  GraduationCap,
  AlertCircle,
  Phone,
  Boxes,
} from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['student', 'owner', 'manager', 'admin']),
  institution: z.string().min(2, 'Institution name is required'),
  department: z.string().optional(),
  phone: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
      institution: 'National Institute of Technology',
      department: 'Computer Science & Engineering',
      phone: '',
    },
  });

  const selectedRole = watch('role');

  const rolesList: { role: UserRole; title: string; desc: string }[] = [
    {
      role: 'student',
      title: 'Student / Researcher',
      desc: 'Book spaces & equipment for projects',
    },
    {
      role: 'owner',
      title: 'Lab / Resource Owner',
      desc: 'Share idle lab apparatus & manage slots',
    },
    {
      role: 'manager',
      title: 'Institution Manager',
      desc: 'Dean, HOD or department supervisor',
    },
    {
      role: 'admin',
      title: 'Platform Admin',
      desc: 'Governance, verification & policies',
    },
  ];

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerAuth(data);
      navigate('/dashboard');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors && err.response.data.errors[0]?.message) ||
        'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 p-0.5 shadow-lg shadow-brand-500/20 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Boxes className="w-6 h-6 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Join the RENTORA Network</h1>
          <p className="text-xs text-slate-400 mt-1">
            Unlock underutilized institutional resources and collaborate across departments
          </p>
        </div>

        <Card>
          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection Cards */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rolesList.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setValue('role', item.role)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRole === item.role
                        ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500'
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">{item.title}</span>
                      <Badge role={item.role} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

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
                placeholder="name@institution.edu"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Institution / College"
                placeholder="e.g. NIT Trichy, IIT Bombay"
                leftIcon={<Building className="w-4 h-4" />}
                error={errors.institution?.message}
                {...register('institution')}
              />

              <Input
                label="Department / Lab"
                placeholder="e.g. Mechanical Engg / FabLab"
                leftIcon={<GraduationCap className="w-4 h-4" />}
                error={errors.department?.message}
                {...register('department')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password (min 6 characters)"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="w-4 h-4" />}
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <Button type="submit" className="w-full mt-4" size="lg" isLoading={isSubmitting}>
              Create RENTORA Account
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already registered in the institutional federation?{' '}
              <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
