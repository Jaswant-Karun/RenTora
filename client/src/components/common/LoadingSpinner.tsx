import React from 'react';
import { Loader2, Layers } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-9 h-9',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 space-y-3 text-center">
      <div className="relative flex items-center justify-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-[#1769D2]`} />
        {size === 'lg' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-[#1769D2]" />
          </div>
        )}
      </div>
      {message && (
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-[#172033]">{message}</p>
          <span className="text-[10px] text-[#64748B] tracking-wider uppercase">RENTORA Enterprise</span>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center bg-[#F8FAFC]">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
