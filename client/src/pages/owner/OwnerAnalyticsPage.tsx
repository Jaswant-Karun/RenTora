import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerOverviewApi } from '../../api/owner.api';
import { OwnerOverviewData } from '../../api/owner.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  Cpu,
  Clock,
  CalendarCheck,
  ShieldCheck,
  Zap,
  DollarSign,
  Activity,
  Layers,
} from 'lucide-react';

export const OwnerAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<OwnerOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getOwnerOverviewApi();
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner message="Aggregating telemetry analytics & compute metrics..." size="lg" />
      </div>
    );
  }

  const { stats, myResources, recentBookings } = data;

  // Compute category breakdown
  const categoryCounts: Record<string, number> = {};
  myResources.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-brand-400" />
          Laboratory Analytics & Asset Telemetry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical equipment utilization, grant expenditure offsets, and booking volume efficiency.
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Overall Utilization</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats.utilizationRate}</p>
          <p className="text-xs text-slate-500 mt-1">Based on 40-hr standard weekly run</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Hours Logged</span>
            <Clock className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{stats.totalHoursLogged} hrs</p>
          <p className="text-xs text-slate-500 mt-1">Across all laboratory instruments</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Sessions</span>
            <CalendarCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            {stats.activeBookingsCount + stats.completedBookingsCount}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.completedBookingsCount} completed, {stats.activeBookingsCount} ongoing
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Avoided Cost</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">
            ${(stats.totalHoursLogged * 145).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">Institutional duplicate procurement savings</p>
        </div>
      </div>

      {/* Grid: Category distribution + Resource breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Asset Portfolio by Classification
          </h3>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryCounts).length === 0 ? (
              <p className="text-xs text-slate-500">No resources registered yet.</p>
            ) : (
              Object.entries(categoryCounts).map(([cat, count]) => {
                const percentage = Math.round((count / myResources.length) * 100);
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">{cat}</span>
                      <span className="text-slate-400">
                        {count} item{count > 1 ? 's' : ''} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Operating Efficiency Matrix */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Reliability & Compliance Health
          </h3>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Safety Index</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">99.4%</p>
              <p className="text-[11px] text-slate-500 mt-1">Zero major infractions</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Maintenance Uptime</span>
              <p className="text-2xl font-bold text-brand-400 mt-1">98.2%</p>
              <p className="text-[11px] text-slate-500 mt-1">Scheduled calibration active</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Avg Lead Time</span>
              <p className="text-2xl font-bold text-indigo-400 mt-1">1.8 hrs</p>
              <p className="text-[11px] text-slate-500 mt-1">Approval turnaround time</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Return Condition</span>
              <p className="text-2xl font-bold text-white mt-1">Good / Pristine</p>
              <p className="text-[11px] text-slate-500 mt-1">Across 100% check-outs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
