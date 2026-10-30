import React from 'react';
import { UserRole } from '../../types/auth';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'slate';
  role?: UserRole;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  role,
  size = 'md',
}) => {
  // If role is passed, map to predefined role styling
  if (role) {
    const roleConfig: Record<UserRole, { label: string; style: string }> = {
      student: {
        label: 'Student / User',
        style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      },
      owner: {
        label: 'Resource Owner',
        style: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      },
      manager: {
        label: 'Institution Manager',
        style: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      },
      admin: {
        label: 'Administrator',
        style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      },
    };

    const config = roleConfig[role];
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border px-2.5 py-0.5 text-xs capitalize ${config.style}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />
        {children || config.label}
      </span>
    );
  }

  const variants = {
    brand: 'bg-brand-500/10 text-brand-300 border-brand-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </span>
  );
};
