import React from 'react';
import { Activity, TrendingUp, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { StatCard } from '../components/common/StatCard';

export const ActivityPage: React.FC = () => {
  const chartData = [
    { month: 'Jun', hours: 32 },
    { month: 'Jul', hours: 48 },
    { month: 'Aug', hours: 64 },
    { month: 'Sep', hours: 82 },
    { month: 'Oct', hours: 95 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-[#172033] tracking-tight">Resource Activity & Telemetry</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Transparent metrics on laboratory hours utilized, research output generated, and procurement cost avoided.
        </p>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Equipment Hours"
          value="321 hrs"
          description="+18 hrs this month"
          icon={<Activity className="w-4 h-4" />}
          trend={{ value: '+18h', isPositive: true }}
        />

        <StatCard
          label="Cost Avoided"
          value="₹1,85,000"
          description="Via shared institutional federation"
          icon={<TrendingUp className="w-4 h-4" />}
          trend={{ value: 'Savings', isPositive: true }}
        />

        <StatCard
          label="Safety Compliance"
          value="100%"
          description="Zero safety violations recorded"
          icon={<CheckCircle2 className="w-4 h-4" />}
          trend={{ value: 'Optimal', isPositive: true }}
        />
      </div>

      {/* Chart Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-sm font-semibold text-[#172033]">Monthly Hours Logged</h2>
            <p className="text-xs text-[#64748B]">Apparatus runtime across semester terms</p>
          </div>
          <span className="text-[11px] font-medium text-[#1769D2] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-blue-200">
            Real-time Telemetry
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}
              />
              <Bar dataKey="hours" name="Hours Logged" fill="#1769D2" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
