import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light-blue';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-[#1769D2] hover:bg-[#1256B0] text-white shadow-sm focus:ring-[#1769D2] border border-transparent',
    secondary:
      'bg-white hover:bg-slate-50 text-[#172033] border border-[#E2E8F0] shadow-sm focus:ring-[#1769D2]',
    outline:
      'bg-transparent border border-[#1769D2] text-[#1769D2] hover:bg-[#EFF6FF] focus:ring-[#1769D2]',
    ghost:
      'text-[#64748B] hover:text-[#172033] hover:bg-slate-100 focus:ring-slate-300',
    danger:
      'bg-[#DC2626] hover:bg-red-700 text-white shadow-sm focus:ring-[#DC2626] border border-transparent',
    'light-blue':
      'bg-[#EFF6FF] hover:bg-blue-100 text-[#1769D2] border border-blue-200 focus:ring-[#1769D2]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2 font-medium',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
