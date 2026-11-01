import React from 'react';

export const RouteLoadingSkeleton: React.FC<{ message?: string }> = ({
  message = 'Loading institutional module...',
}) => {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-slate-200 rounded-lg" />
          <div className="h-3.5 w-72 bg-slate-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-100 rounded-xl hidden sm:block" />
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-200 rounded" />
              <div className="w-7 h-7 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-slate-200 rounded-lg" />
            <div className="h-2.5 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div className="h-4 w-36 bg-slate-200 rounded" />
          <div className="h-8 w-44 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-3 pt-2">
          <div className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl" />
          <div className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl" />
          <div className="h-12 w-full bg-slate-50 border border-slate-100 rounded-xl" />
        </div>
        <div className="text-center pt-2">
          <span className="text-[11px] text-[#64748B] font-medium tracking-wide">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RouteLoadingSkeleton;
