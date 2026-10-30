import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-slate-900/90 text-slate-100 placeholder-slate-500 rounded-xl border text-sm transition-all duration-200
              ${leftIcon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
              ${
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                  : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
              }
              focus:outline-none focus:bg-slate-900 ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-400 font-medium pl-1">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-400 pl-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
