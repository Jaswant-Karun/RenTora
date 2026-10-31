import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#172033]">
            {label}
          </label>
        )}
        <div className="relative rounded-lg">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-white text-[#172033] placeholder-[#94A3B8] rounded-lg border text-sm transition-colors duration-150
              ${leftIcon ? 'pl-9' : 'pl-3.5'} ${rightIcon ? 'pr-9' : 'pr-3.5'} py-2
              ${
                error
                  ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#1769D2] focus:ring-2 focus:ring-[#1769D2]/15'
              }
              focus:outline-none ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
