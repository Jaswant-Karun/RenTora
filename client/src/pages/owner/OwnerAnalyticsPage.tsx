import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CalendarCheck,
  ShieldCheck,
  Layers,
  Calendar,
  Download,
  Printer,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Compass,
  FileSpreadsheet,
  Gauge,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  getResourcePulseMetricsApi,
  exportResourcePulseCSVApi,
  ResourcePulseMetrics,
} from '../../api/resourcePulse.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const OwnerAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ResourcePulseMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'last_7_days' | 'last_30_days' | 'last_90_days' | 'custom'>('last_30_days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await getResourcePulseMetricsApi({
        range,
        startDate: range === 'custom' && customStart ? customStart : undefined,
        endDate: range === 'custom' && customEnd ? customEnd : undefined,
      });

      if (res.success) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Error fetching ResourcePulse metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (range !== 'custom' || (customStart && customEnd)) {
      fetchMetrics();
    }
  }, [range, customStart, customEnd]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const blob = await exportResourcePulseCSVApi({
        range,
        startDate: range === 'custom' ? customStart : undefined,
        endDate: range === 'custom' ? customEnd : undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rentora-ResourcePulse-${range}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting ResourcePulse CSV:', err);
      alert('Error generating CSV report.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-[#1769D2]" />
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                ResourcePulse – Institutional Resource Intelligence Dashboard
              </h1>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Data-driven utilization mathematics, actual booked vs bookable hours, demand telemetry, and actionable observations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Selector Pills */}
            <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-lg text-xs">
              {[
                { id: 'last_7_days', label: '7 Days' },
                { id: 'last_30_days', label: '30 Days' },
                { id: 'last_90_days', label: '90 Days' },
                { id: 'custom', label: 'Custom' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setRange(pill.id as any)}
                  className={`px-3 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                    range === pill.id
                      ? 'bg-[#1769D2] text-white shadow-2xs'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download full intelligence report as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#16834A]" />
              <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Custom Date Pickers (if Custom selected) */}
        {range === 'custom' && (
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center gap-3 text-xs">
            <span className="text-[#64748B] font-semibold">Select Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-[11px]">From:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#172033]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 text-[11px]">To:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1 text-xs text-[#172033]"
              />
            </div>
            <button
              type="button"
              onClick={fetchMetrics}
              className="px-3 py-1 bg-[#1769D2] text-white text-xs font-semibold rounded-lg hover:bg-[#1256B0]"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {loading || !metrics ? (
        <div className="py-24 flex justify-center items-center">
          <LoadingSpinner message="Calculating mathematical utilization & aggregating database telemetry..." size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* 2. Actionable Observations & Insights Feed */}
          {metrics.insights.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" />
                  Actionable Institutional Observations ({metrics.insights.length})
                </span>
                <span className="text-[10px] text-[#64748B]">Evaluated from actual database data</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {metrics.insights.map((ins) => (
                  <div
                    key={ins.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 shadow-2xs ${
                      ins.type === 'warning'
                        ? 'bg-amber-50/50 border-amber-200'
                        : ins.type === 'action_required'
                        ? 'bg-red-50/50 border-red-200'
                        : ins.type === 'success'
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-blue-50/50 border-blue-200'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {ins.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : ins.type === 'action_required' ? (
                        <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                      ) : ins.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#16834A]" />
                      ) : (
                        <Info className="w-4 h-4 text-[#1769D2]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4
                        className={`text-xs font-bold ${
                          ins.type === 'warning'
                            ? 'text-amber-900'
                            : ins.type === 'action_required'
                            ? 'text-red-900'
                            : ins.type === 'success'
                            ? 'text-emerald-900'
                            : 'text-blue-900'
                        }`}
                      >
                        {ins.title}
                      </h4>
                      <p className="text-[11px] text-[#172033] mt-0.5 leading-relaxed">{ins.message}</p>
                      {ins.metricContext && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-[#64748B] bg-white/70 px-2 py-0.5 rounded border border-black/5">
                          {ins.metricContext}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Executive Utilization & KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* Metric 1: Total Registered */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Registered Units</span>
              <span className="text-xl font-extrabold text-[#172033] mt-1 block">
                {metrics.overview.totalRegisteredResources}
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">
                {metrics.overview.availableResources} currently available
              </span>
            </div>

            {/* Metric 2: Utilization Percentage */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#64748B]">Utilization Rate</span>
                <TrendingUp className="w-3.5 h-3.5 text-[#16834A]" />
              </div>
              <span className="text-xl font-extrabold text-[#1769D2] mt-1 block">
                {metrics.overview.utilizationRate}%
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">
                {metrics.overview.totalBookedHours}h / {metrics.overview.totalBookableHours}h bookable
              </span>
            </div>

            {/* Metric 3: Active Sessions */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Active Bookings</span>
              <span className="text-xl font-extrabold text-[#16834A] mt-1 block">
                {metrics.overview.activeBookingsCount}
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">
                {metrics.overview.completedBookingsCount} completed in period
              </span>
            </div>

            {/* Metric 4: Cancellation Rate */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Cancellation Rate</span>
              <span className="text-xl font-extrabold text-[#D97706] mt-1 block">
                {metrics.overview.cancellationRate}%
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">
                {metrics.overview.cancelledBookingsCount} cancelled of {metrics.overview.totalBookingsInPeriod}
              </span>
            </div>

            {/* Metric 5: Waiting List Demand */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Queue Demand</span>
              <span className="text-xl font-extrabold text-indigo-600 mt-1 block">
                {metrics.overview.waitingListDemandCount}
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Waitlist requests</span>
            </div>

            {/* Metric 6: Overdue Returns */}
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Overdue Returns</span>
              <span
                className={`text-xl font-extrabold mt-1 block ${
                  metrics.overview.overdueReturnsCount > 0 ? 'text-[#DC2626]' : 'text-[#16834A]'
                }`}
              >
                {metrics.overview.overdueReturnsCount}
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">
                {metrics.overview.overdueReturnsCount === 0 ? '100% on-time returns' : 'Exceeded reserved window'}
              </span>
            </div>
          </div>

          {/* 4. Interactive Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart A: Booking & Runtime Hours Trend */}
            <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#1769D2]" />
                    Booking & Runtime Hours Trend ({metrics.timeRange.label})
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Aggregated actual sessions and equipment operational hours</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.bookingTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1769D2" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1769D2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      name="Runtime Hours"
                      stroke="#1769D2"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#hoursGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      name="Booking Sessions"
                      stroke="#16834A"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart B: Category-Wise Demand Breakdown */}
            <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <div>
                  <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#1769D2]" />
                    Category-Wise Booking Demand
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Distribution of reservation volume across institutional disciplines</p>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.categoryUsage.slice(0, 6)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="category"
                      stroke="#64748B"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tickFormatter={(val) => (val.length > 12 ? `${val.slice(0, 10)}..` : val)}
                    />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <Bar dataKey="bookingCount" name="Reservations Count" fill="#1769D2" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 5. Peak Usage Periods & Congestion */}
          <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <div>
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#1769D2]" />
                  Peak Usage Periods & Time Slot Congestion
                </h3>
                <p className="text-[11px] text-[#64748B]">Heaviest requested laboratory windows during {metrics.timeRange.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {metrics.peakUsagePeriods.map((slot, i) => (
                <div key={i} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172033]">{slot.timeSlot}</span>
                    <span className="text-[10px] font-bold text-[#1769D2] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      #{i + 1}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-[11px] text-[#64748B]">{slot.bookingCount} sessions</span>
                    <span className="font-semibold text-slate-800">{slot.percentage}% of demand</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-[#1769D2] h-full rounded-full" style={{ width: `${slot.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Frequently Booked vs Underutilized Apparatus Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 1: Top Frequently Booked */}
            <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight className="w-4 h-4 text-[#16834A]" />
                  Frequently Booked Apparatus
                </h3>
                <span className="text-[10px] text-[#64748B]">Top demand performers</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Apparatus</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Bookings</th>
                      <th className="py-2 px-3 text-right">Runtime</th>
                      <th className="py-2 px-3 text-right">Util %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {metrics.frequentlyBookedResources.map((res, i) => (
                      <tr key={res.resourceId} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-semibold text-[#172033] max-w-[160px] truncate">
                          {res.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#64748B] text-[11px] truncate max-w-[100px]">
                          {res.category}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                          {res.bookingCount}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                          {res.totalHours} hrs
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#16834A]">
                          {res.utilizationPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Underutilized Apparatus */}
            <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-[#D97706]" />
                  Underutilized Apparatus
                </h3>
                <span className="text-[10px] text-[#D97706] font-semibold">Opportunities for reallocation</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[10px] uppercase font-bold">
                    <tr>
                      <th className="py-2 px-3">Apparatus</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3">Sessions</th>
                      <th className="py-2 px-3">Observation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {metrics.underutilizedResources.map((res) => (
                      <tr key={res.resourceId} className="hover:bg-[#F8FAFC]">
                        <td className="py-2.5 px-3 font-semibold text-[#172033] max-w-[150px] truncate">
                          {res.name}
                        </td>
                        <td className="py-2.5 px-3 text-[#64748B] text-[11px] truncate max-w-[100px]">
                          {res.category}
                        </td>
                        <td className="py-2.5 px-3 text-[#64748B] font-mono">
                          {res.bookingCount} ({res.totalHours}h)
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[#D97706]">
                          {res.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerAnalyticsPage;
