import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Flame,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { getUtilizationAnalyticsApi, UtilizationAnalyticsData } from '../../api/ai.api';

interface ResourceUtilizationDashboardProps {
  institution?: string;
}

export const ResourceUtilizationDashboard: React.FC<ResourceUtilizationDashboardProps> = ({
  institution,
}) => {
  const [data, setData] = useState<UtilizationAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getUtilizationAnalyticsApi(institution);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching utilization analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [institution]);

  if (loading && !data) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Computing real-time resource utilization & peak demand telemetry...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh and Provider Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Campus Resource Utilization & Peak Demand Intelligence</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time heuristic telemetry tracking facility workload, asset ROI, bottleneck periods & capacity optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {data.aiProvider}
          </span>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Resources */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Total Resources</span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-black text-white">{data.totalResources}</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {data.availableResources} currently ready for checkout
          </div>
        </div>

        {/* Campus Utilization Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Overall Utilization</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-indigo-300">{data.overallUtilizationRate}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${data.overallUtilizationRate}%` }}
            />
          </div>
        </div>

        {/* Booking Frequency */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Booking Frequency</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black text-purple-300">
            {data.bookingFrequency.avgBookingsPerAsset} <span className="text-sm font-normal text-slate-400">/ asset / wk</span>
          </div>
          <p className="text-xs text-slate-400">
            {data.bookingFrequency.totalBookingsMonth} total reservations in the past 30 days
          </p>
        </div>

        {/* Average Reservation Duration */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Avg Session Length</span>
            <Calendar className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-teal-300">
            {data.bookingFrequency.avgDurationHours} <span className="text-sm font-normal text-slate-400">hours</span>
          </div>
          <p className="text-xs text-slate-400">Standard institutional turnaround</p>
        </div>
      </div>

      {/* Grid: Most Requested vs Underutilized Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Requested Assets */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Most Requested Assets</h3>
            </div>
            <span className="text-xs text-slate-400">High-Demand Cluster</span>
          </div>

          <div className="space-y-3">
            {data.mostRequestedResources.map((item, idx) => (
              <div
                key={item.resourceId || idx}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-black flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white">{item.name}</h4>
                    <p className="text-[11px] text-slate-400">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">{item.totalBookings} Bookings</span>
                    <p className="text-[10px] text-slate-500">{item.utilizationRate}% Capacity</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.demandLevel === 'critical'
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        : item.demandLevel === 'very_high'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        : 'bg-brand-500/10 text-brand-300 border border-brand-500/30'
                    }`}
                  >
                    {item.demandLevel.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Underutilized Assets & Actionable Remedies */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Underutilized Resources</h3>
            </div>
            <span className="text-xs text-slate-400">Optimization Targets</span>
          </div>

          <div className="space-y-3">
            {data.underutilizedResources.map((item, idx) => (
              <div
                key={item.resourceId || idx}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <span className="text-[11px] font-semibold text-amber-400">
                    {item.daysInactive} days low activity
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-start gap-1.5 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>AI Remedy:</strong> {item.suggestedRemedy}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Demand Periods & Hourly Load */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              Peak Demand Periods & Hourly Capacity Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{data.peakDemandPeriods.peakHoursSummary}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Peak Days:</span>
            {data.peakDemandPeriods.peakDays.map((day) => (
              <span
                key={day}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/30"
              >
                {day}
              </span>
            ))}
          </div>
        </div>

        {/* Period Distribution Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {data.peakDemandPeriods.hourlyDistribution.map((slot) => (
            <div
              key={slot.period}
              className={`p-4 rounded-2xl border transition-all ${
                slot.isPeak
                  ? 'bg-brand-500/10 border-brand-500/40 shadow-lg shadow-brand-500/10'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{slot.period}</span>
                {slot.isPeak && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-500 text-white">
                    Peak Load
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mb-2">{slot.timeRange}</div>
              <div className="text-xl font-black text-white mb-2">{slot.demandPercentage}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    slot.isPeak ? 'bg-rose-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${slot.demandPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations for Managers */}
      <div className="p-6 rounded-3xl bg-gradient-to-tr from-brand-950/40 via-slate-900 to-indigo-950/40 border border-brand-500/30 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            AI Facility Optimization Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.aiRecommendations.map((rec, rIdx) => (
            <div
              key={rIdx}
              className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3"
            >
              <ArrowUpRight className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-300 leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
