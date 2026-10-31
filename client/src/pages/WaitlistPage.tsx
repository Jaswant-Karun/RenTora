import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertCircle, Compass, CheckCircle2, ShieldAlert } from 'lucide-react';

export const WaitlistPage: React.FC = () => {
  const waitlistItems = [
    {
      id: 'wl-1',
      resourceName: 'NVIDIA DGX A100 Deep Learning High-Performance Cluster Node',
      queuePosition: '#2 in Queue',
      estimatedDate: 'Nov 04, 2026',
      status: 'High Priority',
      category: 'Computers',
    },
    {
      id: 'wl-2',
      resourceName: 'High-Performance Cleanroom & Thin Film Nanotech Lab',
      queuePosition: '#4 in Queue',
      estimatedDate: 'Nov 06, 2026',
      status: 'Queued',
      category: 'Laboratories',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          Queue & Standby
        </div>
        <h1 className="text-2xl font-extrabold text-white">Resource Waiting List</h1>
        <p className="text-xs text-slate-400">
          When high-demand facilities are fully booked, you are placed in an automated priority queue. You will receive an instant notification when a cancellation occurs.
        </p>
      </div>

      <div className="space-y-3">
        {waitlistItems.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-1 text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-brand-300 border border-slate-800">
                {item.category}
              </span>
              <h3 className="text-sm font-bold text-white">{item.resourceName}</h3>
              <p className="text-[11px] text-slate-400">Estimated Allocation: {item.estimatedDate}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 font-bold text-xs border border-amber-500/30">
                {item.queuePosition}
              </span>
              <button className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300">
                Cancel Queue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaitlistPage;
