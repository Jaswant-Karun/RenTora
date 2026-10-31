import React from 'react';

export const StatCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 bg-slate-200 rounded" />
      <div className="w-8 h-8 bg-slate-100 rounded-lg" />
    </div>
    <div className="h-7 w-20 bg-slate-200 rounded" />
    <div className="h-2.5 w-32 bg-slate-100 rounded" />
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-[#E2E8F0] animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-3 px-4">
        <div className="h-3.5 bg-slate-200 rounded w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const CardSkeleton: React.FC = () => (
  <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm animate-pulse space-y-3">
    <div className="h-36 bg-slate-100 rounded-lg w-full" />
    <div className="h-4 w-3/4 bg-slate-200 rounded" />
    <div className="h-3 w-1/2 bg-slate-100 rounded" />
    <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
      <div className="h-3 w-20 bg-slate-100 rounded" />
      <div className="h-7 w-20 bg-slate-200 rounded-lg" />
    </div>
  </div>
);
