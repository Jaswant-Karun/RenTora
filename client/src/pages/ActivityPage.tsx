import React from 'react';
import { Activity, Clock, TrendingUp, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ActivityPage: React.FC = () => {
  const chartData = [
    { month: 'Jun', hours: 32 },
    { month: 'Jul', hours: 48 },
    { month: 'Aug', hours: 64 },
    { month: 'Sep', hours: 82 },
    { month: 'Oct', hours: 95 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" />
          Usage Telemetry
        </div>
        <h1 className="text-2xl font-extrabold text-white">My Resource Activity & Audit</h1>
        <p className="text-xs text-slate-400">
          Transparent metrics on laboratory hours utilized, research output generated, and procurement cost avoided.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total Equipment Hours</span>
          <p className="text-3xl font-extrabold text-white mt-1">321 hrs</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18 hrs this month
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Cost Avoided</span>
          <p className="text-3xl font-extrabold text-cyan-400 mt-1">₹1,85,000</p>
          <p className="text-xs text-slate-400 mt-1">Via shared institutional federation</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Safety Rating</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">100%</p>
          <p className="text-xs text-slate-400 mt-1">Zero safety violations</p>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-extrabold text-white">Monthly Hours Logged</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="hours" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
