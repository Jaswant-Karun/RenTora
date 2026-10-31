import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  description,
  icon,
  trend,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-[#CBD5E1] hover:shadow-md' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-[#64748B]">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-[#172033] tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trend.isPositive ? 'text-[#16834A]' : 'text-[#64748B]'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {description && (
        <p className="text-[11px] text-[#64748B] mt-1 truncate">{description}</p>
      )}
    </div>
  );
};
