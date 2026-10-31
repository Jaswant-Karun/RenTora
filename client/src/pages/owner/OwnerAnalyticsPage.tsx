import React, { useState, useEffect } from 'react';
import { getOwnerOverviewApi } from '../../api/owner.api';
import { OwnerOverviewData } from '../../api/owner.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CalendarCheck,
  ShieldCheck,
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

  const { stats, myResources } = data;

  // Compute category breakdown
  const categoryCounts: Record<string, number> = {};
  myResources.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-[#1769D2]" />
          Laboratory Analytics & Asset Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Historical equipment utilization, grant expenditure offsets, and booking volume efficiency.
        </p>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>Overall Utilization</span>
            <TrendingUp className="w-4 h-4 text-[#16834A]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{stats.utilizationRate}</p>
          <p className="text-xs text-[#64748B] mt-1">Based on 40-hr standard weekly run</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>Hours Logged</span>
            <Clock className="w-4 h-4 text-[#1769D2]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{stats.totalHoursLogged} hrs</p>
          <p className="text-xs text-[#64748B] mt-1">Across all laboratory instruments</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>Total Sessions</span>
            <CalendarCheck className="w-4 h-4 text-[#1769D2]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">
            {stats.activeBookingsCount + stats.completedBookingsCount}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {stats.completedBookingsCount} completed, {stats.activeBookingsCount} ongoing
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between text-[#64748B] text-xs font-semibold uppercase tracking-wider">
            <span>Safety Health Index</span>
            <ShieldCheck className="w-4 h-4 text-[#16834A]" />
          </div>
          <p className="text-2xl font-bold text-[#16834A] mt-2">
            {stats.activeIncidents === 0 ? '100%' : '94.2%'}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {stats.activeIncidents} active safety flags
          </p>
        </div>
      </div>

      {/* Grid: Category Distribution & Asset Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#172033] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1769D2]" />
              Portfolio Category Breakdown
            </h3>
            <span className="text-xs text-[#64748B]">{myResources.length} Total Units</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / (myResources.length || 1)) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#172033]">{cat}</span>
                    <span className="text-[#64748B]">
                      {count} units ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1769D2] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-[#172033] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1769D2]" />
            Asset Telemetry Highlights
          </h3>

          <div className="space-y-2.5">
            {myResources.slice(0, 4).map((r) => (
              <div
                key={r._id}
                className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-[#172033]">{r.name}</h4>
                  <p className="text-[#64748B] text-[11px]">{r.location}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-[#16834A] block">Operational</span>
                  <span className="text-[10px] text-[#64748B]">
                    {r.minBookingDuration || 1}h - {r.maxBookingDuration || 8}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalyticsPage;
