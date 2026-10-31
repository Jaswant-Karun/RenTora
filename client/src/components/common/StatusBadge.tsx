import React from 'react';

export type EntityStatus =
  | 'available'
  | 'reserved'
  | 'maintenance'
  | 'in_use'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'waitlisted'
  | 'checked_in'
  | 'return_pending'
  | 'completed'
  | 'cancelled'
  | 'active'
  | 'open'
  | 'resolved';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  const statusConfig: Record<string, { label: string; style: string }> = {
    available: { label: 'Available', style: 'bg-emerald-50 text-[#16834A] border-emerald-200' },
    reserved: { label: 'Reserved', style: 'bg-blue-50 text-[#1769D2] border-blue-200' },
    maintenance: { label: 'Maintenance', style: 'bg-amber-50 text-[#D97706] border-amber-200' },
    in_use: { label: 'In Use', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    active: { label: 'Active', style: 'bg-emerald-50 text-[#16834A] border-emerald-200' },
    pending: { label: 'Pending', style: 'bg-amber-50 text-[#D97706] border-amber-200' },
    under_review: { label: 'Under Review', style: 'bg-blue-50 text-[#1769D2] border-blue-200' },
    approved: { label: 'Approved', style: 'bg-emerald-50 text-[#16834A] border-emerald-200' },
    rejected: { label: 'Rejected', style: 'bg-red-50 text-[#DC2626] border-red-200' },
    waitlisted: { label: 'Waitlisted', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    checked_in: { label: 'Checked In', style: 'bg-teal-50 text-teal-700 border-teal-200' },
    return_pending: { label: 'Return Pending', style: 'bg-blue-50 text-[#1769D2] border-blue-200' },
    completed: { label: 'Completed', style: 'bg-slate-100 text-[#64748B] border-slate-200' },
    cancelled: { label: 'Cancelled', style: 'bg-slate-100 text-[#64748B] border-slate-200' },
    open: { label: 'Open', style: 'bg-amber-50 text-[#D97706] border-amber-200' },
    resolved: { label: 'Resolved', style: 'bg-emerald-50 text-[#16834A] border-emerald-200' },
  };

  const config = statusConfig[normalized] || {
    label: status.replace(/_/g, ' '),
    style: 'bg-slate-100 text-[#64748B] border-slate-200',
  };

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${config.style} capitalize ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 shrink-0" />
      {config.label}
    </span>
  );
};
