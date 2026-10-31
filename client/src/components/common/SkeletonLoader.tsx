import React from 'react';

export const StatCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
    <div className="flex items-center justify-between">
      <div className="h-3 w-24 bg-slate-800 rounded" />
      <div className="w-5 h-5 bg-slate-800 rounded-lg" />
    </div>
    <div className="h-8 w-20 bg-slate-800 rounded-lg" />
    <div className="h-2 w-32 bg-slate-800 rounded" />
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-slate-800/60 animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <div className="h-4 bg-slate-800 rounded w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const CardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3">
    <div className="h-36 bg-slate-800 rounded-xl w-full" />
    <div className="h-4 w-3/4 bg-slate-800 rounded" />
    <div className="h-3 w-1/2 bg-slate-800 rounded" />
    <div className="flex justify-between items-center pt-2">
      <div className="h-3 w-20 bg-slate-800 rounded" />
      <div className="h-7 w-20 bg-slate-800 rounded-lg" />
    </div>
  </div>
);
