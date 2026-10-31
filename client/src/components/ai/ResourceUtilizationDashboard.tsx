import React, { useState, useEffect } from 'react';
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
      <div className="p-8 rounded-xl bg-white border border-[#E2E8F0] text-center space-y-4">
        <div className="w-8 h-8 border-2 border-[#1769D2]/20 border-t-[#1769D2] rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[#64748B]">Computing real-time resource utilization & peak demand telemetry...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header with Refresh and Provider Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#1769D2]/20 flex items-center justify-center text-[#1769D2]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-[#172033]">Campus Resource Utilization & Peak Demand</h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time telemetry tracking facility workload, asset ROI, bottleneck periods & capacity optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-[#16834A] border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-pulse" />
            {data.aiProvider}
          </span>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="p-2 bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172033] rounded-lg transition-colors border border-[#E2E8F0]"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Resources */}
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium uppercase tracking-wider">
            <span>Total Resources</span>
            <Layers className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{data.totalResources}</div>
          <div className="text-xs text-[#16834A] flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {data.availableResources} currently ready for checkout
          </div>
        </div>

        {/* Campus Utilization Rate */}
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium uppercase tracking-wider">
            <span>Overall Utilization</span>
            <TrendingUp className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-2xl font-bold text-[#1769D2]">{data.overallUtilizationRate}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#1769D2] h-full rounded-full transition-all duration-1000"
              style={{ width: `${data.overallUtilizationRate}%` }}
            />
          </div>
        </div>

        {/* Booking Frequency */}
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium uppercase tracking-wider">
            <span>Booking Frequency</span>
            <Clock className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">
            {data.bookingFrequency.avgBookingsPerAsset} <span className="text-xs font-normal text-[#64748B]">/ asset / wk</span>
          </div>
          <p className="text-xs text-[#64748B]">
            {data.bookingFrequency.totalBookingsMonth} total reservations in past 30 days
          </p>
        </div>

        {/* Average Reservation Duration */}
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B] font-medium uppercase tracking-wider">
            <span>Avg Session Length</span>
            <Calendar className="w-4 h-4 text-[#1769D2]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">
            {data.bookingFrequency.avgDurationHours} <span className="text-xs font-normal text-[#64748B]">hours</span>
          </div>
          <p className="text-xs text-[#64748B]">Standard turnaround</p>
        </div>
      </div>

      {/* Grid: Most Requested vs Underutilized Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Requested Assets */}
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-semibold text-[#172033]">Most Requested Assets</h3>
            </div>
            <span className="text-xs text-[#64748B]">High-Demand</span>
          </div>

          <div className="space-y-2.5">
            {data.mostRequestedResources.map((item, idx) => (
              <div
                key={item.resourceId || idx}
                className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-slate-200 text-[#172033] text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-[#172033]">{item.name}</h4>
                    <p className="text-[11px] text-[#64748B]">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#172033]">{item.totalBookings} Bookings</span>
                    <p className="text-[10px] text-[#64748B]">{item.utilizationRate}% Capacity</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      item.demandLevel === 'critical'
                        ? 'bg-red-50 text-[#DC2626] border border-red-200'
                        : item.demandLevel === 'very_high'
                        ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                        : 'bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20'
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
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-semibold text-[#172033]">Underutilized Resources</h3>
            </div>
            <span className="text-xs text-[#64748B]">Optimization Targets</span>
          </div>

          <div className="space-y-2.5">
            {data.underutilizedResources.map((item, idx) => (
              <div
                key={item.resourceId || idx}
                className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#172033]">{item.name}</h4>
                  <span className="text-[11px] font-medium text-[#D97706]">
                    {item.daysInactive} days low activity
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] flex items-start gap-1.5 bg-white p-2 rounded border border-[#E2E8F0]">
                  <Sparkles className="w-3.5 h-3.5 text-[#1769D2] shrink-0 mt-0.5" />
                  <span><strong>AI Remedy:</strong> {item.suggestedRemedy}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Demand Periods & Hourly Load */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1769D2]" />
              Peak Demand Periods & Hourly Capacity Distribution
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">{data.peakDemandPeriods.peakHoursSummary}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B]">Peak Days:</span>
            {data.peakDemandPeriods.peakDays.map((day) => (
              <span
                key={day}
                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20"
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
              className={`p-3.5 rounded-lg border transition-all ${
                slot.isPeak
                  ? 'bg-red-50 border-red-200'
                  : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#172033]">{slot.period}</span>
                {slot.isPeak && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#DC2626] text-white">
                    Peak Load
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#64748B] mb-2">{slot.timeRange}</div>
              <div className="text-lg font-bold text-[#172033] mb-2">{slot.demandPercentage}%</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    slot.isPeak ? 'bg-[#DC2626]' : 'bg-[#1769D2]'
                  }`}
                  style={{ width: `${slot.demandPercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations for Managers */}
      <div className="p-5 sm:p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1769D2]" />
          <h3 className="text-sm font-semibold text-[#172033]">
            AI Facility Optimization Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.aiRecommendations.map((rec, rIdx) => (
            <div
              key={rIdx}
              className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5"
            >
              <ArrowUpRight className="w-4 h-4 text-[#1769D2] mt-0.5 shrink-0" />
              <span className="text-xs text-[#172033] leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
