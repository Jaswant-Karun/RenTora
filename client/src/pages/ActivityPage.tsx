import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Clock,
  TrendingUp,
  Cpu,
  Users,
  Repeat,
  Download,
  Settings2,
  Info,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  getEcoShareInsightsApi,
  getSustainabilityAssumptionsApi,
  updateSustainabilityAssumptionsApi,
  downloadSustainabilityReportApi,
  IEcoShareInsights,
  ISustainabilityConfig,
} from '../api/ecoShare.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const ActivityPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<IEcoShareInsights | null>(null);
  const [timeframeTab, setTimeframeTab] = useState<'monthly' | 'yearly'>('monthly');

  // Assumption Configuration Modal state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configForm, setConfigForm] = useState<ISustainabilityConfig>({
    costAvoidedPerHourINR: 1850,
    purchaseAvoidanceThresholdHours: 80,
    averageApparatusCapitalCostINR: 250000,
    lifecycleEmbodiedCarbonEstimateKgPerUnit: 350,
    methodologyNotes: '',
  });

  const isPrivileged = user?.role === 'manager' || user?.role === 'admin';

  const fetchData = async () => {
    try {
      const res = await getEcoShareInsightsApi();
      if (res.success && res.data) {
        setData(res.data);
        if (res.data.config) {
          setConfigForm(res.data.config);
        }
      }
    } catch (err: any) {
      console.error('Failed to load EcoShare telemetry:', err);
      showToast('error', 'Unable to aggregate institutional sustainability insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleDownloadCSV = async () => {
    try {
      showToast('info', 'Generating verified sustainability impact report...');
      const blob = await downloadSustainabilityReportApi();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `rentora-ecoshare-sustainability-report-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', 'Sustainability report downloaded successfully');
    } catch (err: any) {
      console.error('Report export failed:', err);
      showToast('error', 'Failed to generate downloadable impact report');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await updateSustainabilityAssumptionsApi(configForm);
      if (res.success) {
        showToast('success', 'Institutional calculation assumptions updated successfully');
        setIsConfigOpen(false);
        fetchData();
      }
    } catch (err: any) {
      console.error('Failed to update sustainability configuration:', err);
      showToast('error', err.response?.data?.message || 'Failed to update assumptions');
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="py-28 flex justify-center items-center">
        <LoadingSpinner message="Aggregating verified completed bookings & calculating sustainability impact..." size="lg" />
      </div>
    );
  }

  const summary = data?.summary || {
    totalCompletedBookings: 0,
    totalSharedHours: 0,
    activelySharedResourcesCount: 0,
    totalRegisteredResources: 0,
    sharedAdoptionPercentage: 0,
    uniqueBorrowersCount: 0,
    reuseMultiplier: 0,
    estimatedAvoidedDuplicateUnits: 0,
    estimatedCapExAvoidedINR: 0,
    estimatedEmbodiedCarbonAvoidedKg: 0,
    estimatedUtilizationImprovementPct: 0,
  };

  const hasInsufficientData = data?.insufficientData;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Leaf className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                EcoShare – Shared Resource Sustainability Insights
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-blue-50 text-[#1769D2] border border-blue-200">
                LIFECYCLE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-[#64748B] max-w-3xl">
              Demonstrating how sharing institutional apparatus avoids duplicate capital procurement, lowers academic expenditure, and elevates laboratory asset utilization across faculties.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#172033] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-slate-100 transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {isPrivileged && (
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#172033] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] shadow-sm transition-colors"
              >
                <Settings2 className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Configure Assumptions</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Impact Report (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Insufficient Data Notice Banner (Mandatory Rule) */}
      {hasInsufficientData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-950">Insufficient Completed Booking Data</p>
            <p className="text-amber-800 leading-relaxed">
              {data?.dataNotice ||
                'Sustainability metrics and avoided capital expenditure projections require verified completed bookings to maintain academic integrity and prevent speculative estimations. Complete resource reservations through the TrustPass checkout flow to automatically populate live impact figures.'}
            </p>
          </div>
        </div>
      )}

      {/* Key Metric Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed Shared Usage */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Completed Shared Bookings</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-[#1769D2]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#172033]">
              {summary.totalCompletedBookings}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
              <span className="font-medium text-emerald-600">100% verified</span> checkouts
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] border-t border-[#F1F5F9] pt-2 flex items-center justify-between">
            <span>Verified Activity</span>
            <span className="font-medium text-[#172033]">Actual Database</span>
          </div>
        </div>

        {/* Card 2: Shared Booking Hours */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Total Shared Hours</span>
            <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#172033]">
              {summary.totalSharedHours} <span className="text-sm font-semibold text-[#64748B]">hrs</span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Across {summary.categoryBreakdown?.length || 0} apparatus categories
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] border-t border-[#F1F5F9] pt-2 flex items-center justify-between">
            <span>Runtime Telemetry</span>
            <span className="font-medium text-[#172033]">Aggregated</span>
          </div>
        </div>

        {/* Card 3: Actively Shared Resources & Reuse Multiplier */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#64748B]">Actively Shared Resources</span>
            <span className="p-1.5 rounded-md bg-purple-50 text-purple-600">
              <Cpu className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-[#172033]">
              {summary.activelySharedResourcesCount}{' '}
              <span className="text-xs font-normal text-[#64748B]">
                / {summary.totalRegisteredResources} active
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
              <Repeat className="w-3 h-3 text-purple-600" />
              <span>Reuse Multiplier:</span>
              <strong className="text-purple-700 font-semibold">{summary.reuseMultiplier}x</strong>
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] border-t border-[#F1F5F9] pt-2 flex items-center justify-between">
            <span>Campus Adoption</span>
            <span className="font-semibold text-purple-700">{summary.sharedAdoptionPercentage}%</span>
          </div>
        </div>

        {/* Card 4: Estimated Utilization Improvement */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-[#64748B]">Estimated Utilization Lift</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                ESTIMATE
              </span>
            </div>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-emerald-600">
              +{summary.estimatedUtilizationImprovementPct}%
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              vs isolated department baseline
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] border-t border-[#F1F5F9] pt-2 flex items-center justify-between">
            <span>Borrower Diversity</span>
            <span className="font-medium text-[#172033]">{summary.uniqueBorrowersCount} Researchers</span>
          </div>
        </div>
      </div>

      {/* Environmental & Financial Impact (Clear ESTIMATE Badges + Methodology Explanations) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Estimated Avoided Purchases */}
        <div className="bg-gradient-to-br from-white to-blue-50/30 border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#172033]">Estimated Avoided Purchases</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                ESTIMATE
              </span>
            </div>
            <div className="group relative cursor-pointer">
              <HelpCircle className="w-4 h-4 text-[#64748B] hover:text-[#172033]" />
              <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-30 leading-snug">
                Calculated as Total Shared Hours ÷ {data?.config.purchaseAvoidanceThresholdHours || 80} threshold hours. Assumes cross-department access avoids purchasing redundant duplicate apparatus.
              </div>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#1769D2]">
              ~{summary.estimatedAvoidedDuplicateUnits}
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Apparatus units deferred or averted from redundant faculty purchase requests.
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
            <span className="font-semibold text-[#172033]">Assumption:</span> 1 duplicate unit avoided per {data?.config.purchaseAvoidanceThresholdHours || 80} hrs of logged sharing.
          </div>
        </div>

        {/* Estimated Avoided CapEx */}
        <div className="bg-gradient-to-br from-white to-emerald-50/30 border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#172033]">Estimated CapEx Avoided</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                ESTIMATE
              </span>
            </div>
            <div className="group relative cursor-pointer">
              <HelpCircle className="w-4 h-4 text-[#64748B] hover:text-[#172033]" />
              <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-30 leading-snug">
                Total hours multiplied by configured amortized avoidance rate (₹{data?.config.costAvoidedPerHourINR || 1850}/hr). Reflects research grant optimization.
              </div>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600">
              ~₹{summary.estimatedCapExAvoidedINR.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Institutional grant capital saved via cross-department shared infrastructure.
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
            <span className="font-semibold text-[#172033]">Configured Rate:</span> ₹{data?.config.costAvoidedPerHourINR || 1850} / shared apparatus hour.
          </div>
        </div>

        {/* Estimated Embodied Carbon Avoided */}
        <div className="bg-gradient-to-br from-white to-teal-50/30 border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#172033]">Embodied Carbon Avoided</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                ESTIMATE
              </span>
            </div>
            <div className="group relative cursor-pointer">
              <HelpCircle className="w-4 h-4 text-[#64748B] hover:text-[#172033]" />
              <div className="hidden group-hover:block absolute right-0 top-6 w-64 p-2.5 bg-slate-900 text-white text-[11px] rounded-lg shadow-lg z-30 leading-snug">
                Scope 3 proxy for hardware manufacturing and supply-chain logistics averted (~{data?.config.lifecycleEmbodiedCarbonEstimateKgPerUnit || 350} kg CO2e per avoided hardware unit). Not a certified carbon credit.
              </div>
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-teal-700">
              ~{summary.estimatedEmbodiedCarbonAvoidedKg} <span className="text-sm font-semibold text-[#64748B]">kg CO₂e</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Proxy reduction in manufacturing lifecycle emissions from deferred purchases.
            </p>
          </div>
          <div className="text-[11px] text-[#64748B] bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
            <span className="font-semibold text-[#172033]">Proxy Factor:</span> ~{data?.config.lifecycleEmbodiedCarbonEstimateKgPerUnit || 350} kg CO₂e per averted apparatus.
          </div>
        </div>
      </div>

      {/* Visualizations: Category-Wise Shared Usage & CapEx */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Shared Booking Hours by Category</h2>
              <p className="text-xs text-[#64748B]">Actual completed laboratory usage distributed across apparatus types</p>
            </div>
            <span className="text-[11px] font-semibold text-[#1769D2] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Runtime Telemetry
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="category"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    }}
                    formatter={(val: any, name: any) => [
                      name === 'totalHours' ? `${val} hours` : val,
                      name === 'totalHours' ? 'Completed Hours' : name,
                    ]}
                  />
                  <Bar dataKey="totalHours" name="Completed Hours" fill="#1769D2" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748B]">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-medium">No category telemetry available</p>
                <p className="text-[11px] text-slate-400">Complete bookings to populate category charts</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-sm font-bold text-[#172033]">Category Sharing & CapEx Ledger</h2>
                <p className="text-xs text-[#64748B]">Detailed reuse metrics and estimated avoided capital per resource domain</p>
              </div>
              <span className="text-[11px] text-[#64748B]">
                {data?.categoryBreakdown?.length || 0} categories active
              </span>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold text-[11px]">
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2 text-center">Bookings</th>
                    <th className="py-2 px-2 text-center">Shared Hours</th>
                    <th className="py-2 px-2 text-center">Share</th>
                    <th className="py-2 px-2 text-right">Est. CapEx Saved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                    data.categoryBreakdown.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-2 font-medium text-[#172033]">
                          {cat.category}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#64748B]">
                          {cat.completedBookings}
                        </td>
                        <td className="py-2.5 px-2 text-center font-semibold text-[#172033]">
                          {cat.totalHours} hrs
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#64748B]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[10px]">
                            {cat.shareOfTotalHoursPct}%
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-semibold text-emerald-700">
                          ~₹{cat.estimatedCapExAvoidedINR.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#64748B] text-xs">
                        No completed category bookings recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] text-[11px] text-[#64748B] flex items-center justify-between">
            <span>Values tagged with ~ are estimates based on ₹{data?.config.costAvoidedPerHourINR}/hr</span>
          </div>
        </div>
      </div>

      {/* Monthly and Yearly Impact Reports */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#E2E8F0] gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#172033]">Periodic Sustainability Impact Reports</h2>
            <p className="text-xs text-[#64748B]">Tracking historical shared resource reuse, avoided capital, and lifecycle proxy carbon over time</p>
          </div>

          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] text-xs">
            <button
              type="button"
              onClick={() => setTimeframeTab('monthly')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                timeframeTab === 'monthly'
                  ? 'bg-white text-[#1769D2] shadow-sm font-semibold'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Monthly Reports ({data?.monthlyImpact?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setTimeframeTab('yearly')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                timeframeTab === 'yearly'
                  ? 'bg-white text-[#1769D2] shadow-sm font-semibold'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              Yearly Summary ({data?.yearlyImpact?.length || 0})
            </button>
          </div>
        </div>

        {/* Tabbed Table Display */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold text-[11px] bg-slate-50/50">
                <th className="py-2.5 px-3">{timeframeTab === 'monthly' ? 'Academic Month' : 'Calendar Year'}</th>
                <th className="py-2.5 px-3 text-center">Completed Bookings</th>
                <th className="py-2.5 px-3 text-center">Total Shared Hours</th>
                <th className="py-2.5 px-3 text-center">Active Borrowers</th>
                <th className="py-2.5 px-3 text-right">Est. CapEx Saved (INR)</th>
                <th className="py-2.5 px-3 text-right">Est. Embodied CO₂ Avoided</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timeframeTab === 'monthly' ? (
                data?.monthlyImpact && data.monthlyImpact.length > 0 ? (
                  data.monthlyImpact.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#172033] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>{item.monthLabel}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#64748B]">{item.completedBookings}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-[#172033]">{item.totalHours} hrs</td>
                      <td className="py-2.5 px-3 text-center text-[#64748B]">{item.uniqueBorrowersCount}</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                        ~₹{item.estimatedCapExAvoidedINR.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-teal-800">
                        ~{item.estimatedEmbodiedCarbonKg} kg CO₂e
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B]">
                      No monthly impact records found.
                    </td>
                  </tr>
                )
              ) : data?.yearlyImpact && data.yearlyImpact.length > 0 ? (
                data.yearlyImpact.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#172033] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>Year {item.year}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-[#64748B]">{item.completedBookings}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-[#172033]">{item.totalHours} hrs</td>
                    <td className="py-2.5 px-3 text-center text-[#64748B]">{item.uniqueBorrowersCount}</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                      ~₹{item.estimatedCapExAvoidedINR.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-teal-800">
                      ~{item.estimatedEmbodiedCarbonKg} kg CO₂e
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#64748B]">
                    No yearly impact records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actionable Sustainability Insights based on Database Activity */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-50 text-[#1769D2]">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Institution-Level Sustainability Insights</h2>
              <p className="text-xs text-[#64748B]">Automated observations derived from actual completed reservation telemetry</p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-[#64748B]">
            {data?.actionableInsights?.length || 0} Observations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.actionableInsights && data.actionableInsights.length > 0 ? (
            data.actionableInsights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      {insight.category}
                    </span>
                    {insight.isEstimate && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                        ESTIMATE
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-[#172033] leading-snug">
                    {insight.title}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {insight.observation}
                  </p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-[#E2E8F0] text-[11px] text-slate-700 space-y-1">
                  <span className="font-semibold text-[#1769D2] block">Recommendation:</span>
                  <p>{insight.recommendation}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-[#64748B] text-xs">
              No specific sustainability alerts active for current dataset.
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Methodology, Rules & Transparent Disclaimers Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-700 text-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldAlert className="w-4 h-4 text-slate-600" />
          <span>Sustainability Methodology & Calculation Transparency Notice</span>
        </div>
        <p className="leading-relaxed">
          {data?.disclaimers.methodologyExplanation ||
            'Estimates reflect avoided duplicate institutional procurement based on amortized laboratory apparatus usage. These figures represent engineering estimates and are not certified carbon offsets.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-200 font-mono text-[11px]">
          <div>
            <span className="text-slate-400 block">AVOIDANCE RATE:</span>
            <span className="font-semibold text-slate-800">₹{data?.config.costAvoidedPerHourINR}/hr</span>
          </div>
          <div>
            <span className="text-slate-400 block">THRESHOLD:</span>
            <span className="font-semibold text-slate-800">{data?.config.purchaseAvoidanceThresholdHours} hrs / unit</span>
          </div>
          <div>
            <span className="text-slate-400 block">CAPITAL BASELINE:</span>
            <span className="font-semibold text-slate-800">₹{data?.config.averageApparatusCapitalCostINR.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-400 block">LIFECYCLE CARBON:</span>
            <span className="font-semibold text-slate-800">{data?.config.lifecycleEmbodiedCarbonEstimateKgPerUnit} kg CO₂e / unit</span>
          </div>
        </div>
        <div className="bg-white/80 p-2.5 rounded border border-slate-200 text-[11px] text-slate-500">
          <strong className="text-slate-700">Governance Rule:</strong> RENTORA does not present estimated figures as verified environmental savings. All Scope 3 and CapEx metrics are engineering proxies derived strictly from verified completed bookings logged in the database.
        </div>
      </div>

      {/* Modal: Configure Assumptions (Manager / Admin) */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#1769D2]">
                  <Settings2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#172033]">Configure Sustainability Assumptions</h3>
                  <p className="text-xs text-[#64748B]">Adjust campus financial & lifecycle engineering proxies</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="text-[#64748B] hover:text-[#172033] text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Amortized Cost Avoided Per Shared Hour (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={configForm.costAvoidedPerHourINR}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, costAvoidedPerHourINR: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  Default: ₹1,850/hr based on university shared scientific instrumentation amortized cost.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Purchase Avoidance Threshold (Hours Logged)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={configForm.purchaseAvoidanceThresholdHours}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      purchaseAvoidanceThresholdHours: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  Hours of shared usage required to justify averting 1 duplicate hardware purchase (Default: 80 hrs).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Avg Apparatus Capital Cost (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={configForm.averageApparatusCapitalCostINR}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        averageApparatusCapitalCostINR: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Embodied CO₂ Proxy (kg/unit)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={configForm.lifecycleEmbodiedCarbonEstimateKgPerUnit}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        lifecycleEmbodiedCarbonEstimateKgPerUnit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Methodology & Disclaimer Notes
                </label>
                <textarea
                  rows={3}
                  value={configForm.methodologyNotes}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, methodologyNotes: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#1769D2]"
                  placeholder="Explain institutional assumptions for transparency..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#64748B] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#1769D2] hover:bg-[#1256B0] shadow-sm transition-colors"
                >
                  {savingConfig ? 'Saving...' : 'Save Assumptions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
