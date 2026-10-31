import React from 'react';
import { UserRole } from '../../types/auth';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'slate' | 'info';
  role?: UserRole;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  role,
  size = 'md',
  className = '',
}) => {
  if (role) {
    const roleConfig: Record<UserRole, { label: string; style: string }> = {
      student: {
        label: 'Student / Researcher',
        style: 'bg-emerald-50 text-[#16834A] border-emerald-200',
      },
      owner: {
        label: 'Lab Custodian',
        style: 'bg-[#EFF6FF] text-[#1769D2] border-blue-200',
      },
      manager: {
        label: 'Campus Manager',
        style: 'bg-amber-50 text-[#D97706] border-amber-200',
      },
      admin: {
        label: 'Platform Admin',
        style: 'bg-purple-50 text-purple-700 border-purple-200',
      },
    };

    const config = roleConfig[role];
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full border px-2.5 py-0.5 text-xs ${config.style} ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />
        {children || config.label}
      </span>
    );
  }

  const variants = {
    brand: 'bg-[#EFF6FF] text-[#1769D2] border-blue-200',
    info: 'bg-[#EFF6FF] text-[#1769D2] border-blue-200',
    success: 'bg-emerald-50 text-[#16834A] border-emerald-200',
    warning: 'bg-amber-50 text-[#D97706] border-amber-200',
    danger: 'bg-red-50 text-[#DC2626] border-red-200',
    slate: 'bg-slate-100 text-[#64748B] border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
