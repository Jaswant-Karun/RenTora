import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 text-center border border-[#E2E8F0] rounded-xl bg-white shadow-sm ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center mb-3">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-[#172033]">{title}</h3>
      <p className="text-xs text-[#64748B] mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
