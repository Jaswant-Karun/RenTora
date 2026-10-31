import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOwnerOverviewApi, deleteOwnerResourceApi } from '../../api/owner.api';
import { OwnerOverviewData } from '../../api/owner.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Cpu,
  Inbox,
  CheckCircle2,
  PlusCircle,
  QrCode,
  AlertTriangle,
  History,
  Trash2,
} from 'lucide-react';

export const OwnerOverviewPage: React.FC = () => {
  const [data, setData] = useState<OwnerOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await getOwnerOverviewApi();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching owner overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleDeleteResource = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to decommission "${name}"?`)) return;
    try {
      await deleteOwnerResourceApi(id);
      await fetchOverview();
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner message="Loading your lab custodian command center..." size="lg" />
      </div>
    );
  }

  const { stats, myResources, recentBookings } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] border border-[#1769D2]/20 text-[#1769D2] text-[10px] font-semibold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            Resource Custodian Console
          </div>
          <h1 className="text-2xl font-bold text-[#172033]">
            Equipment & Laboratory Custodian Center
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl">
            Monitor incoming reservation requests, resolve timeslot conflicts, track equipment check-ins, and inspect condition logs.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/owner/add-resource"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Resource</span>
            </Link>
            <Link
              to="/owner/requests"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#172033] text-xs font-medium border border-[#E2E8F0] transition-all"
            >
              <Inbox className="w-4 h-4 text-[#1769D2]" />
              <span>Review Requests ({stats.pendingRequestsCount})</span>
            </Link>
            <Link
              to="/owner/checkin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#1769D2] text-xs font-medium border border-[#1769D2]/20 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Check-in / Check-out</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Widget */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-[#64748B]">Total Operating Hours</span>
            <span className="font-mono font-bold text-[#16834A] text-sm">{stats.totalHoursLogged} hrs</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-[#64748B]">Campus Utilization</span>
            <span className="font-mono font-bold text-[#1769D2] text-sm">{stats.utilizationRate}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-[#64748B]">Active Incidents</span>
            <span className="font-mono font-bold text-[#D97706] text-sm">{stats.activeIncidents}</span>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">My Listed Resources</span>
            <Cpu className="w-4 h-4 text-[#1769D2]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{stats.totalListedResources}</p>
          <p className="text-xs text-[#64748B] mt-1">Federated across campus</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Pending Requests</span>
            <Inbox className="w-4 h-4 text-[#D97706]" />
          </div>
          <p className="text-2xl font-bold text-[#D97706] mt-2">{stats.pendingRequestsCount}</p>
          <p className="text-xs text-[#D97706] mt-1">Action required</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Active Bookings</span>
            <CheckCircle2 className="w-4 h-4 text-[#16834A]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{stats.activeBookingsCount}</p>
          <p className="text-xs text-[#16834A] mt-1">Passes active</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Completed Sessions</span>
            <History className="w-4 h-4 text-[#1769D2]" />
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2">{stats.completedBookingsCount}</p>
          <p className="text-xs text-[#64748B] mt-1">Fully checked out & logged</p>
        </div>
      </div>

      {/* Main Grid: My Listed Resources & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Listed Resources (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#172033]">My Managed Facilities & Equipment</h3>
              <p className="text-xs text-[#64748B]">Live catalogue entries under your departmental custody</p>
            </div>
            <Link to="/owner/add-resource" className="text-xs text-[#1769D2] font-semibold hover:underline">
              + Add Resource
            </Link>
          </div>

          <div className="space-y-3">
            {myResources.map((res) => (
              <div
                key={res._id}
                className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={res.images?.[0]}
                    alt={res.name}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border border-[#E2E8F0]"
                  />
                  <div className="min-w-0 space-y-0.5 text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                      {res.category}
                    </span>
                    <h4 className="font-semibold text-[#172033] truncate text-sm">{res.name}</h4>
                    <p className="text-[#64748B] truncate">{res.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/dashboard/resources/${res._id}`}
                    className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 text-xs text-[#172033] font-medium transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDeleteResource(res._id, res.name)}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                    title="Decommission"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Incoming Requests Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#172033]">Recent Requests & Bookings</h3>
              <p className="text-xs text-[#64748B]">Incoming borrower reservation passes</p>
            </div>
            <Link to="/owner/requests" className="text-xs text-[#1769D2] font-semibold hover:underline">
              View all ({stats.pendingRequestsCount})
            </Link>
          </div>

          <div className="space-y-3">
            {recentBookings.slice(0, 4).map((b) => (
              <div
                key={b._id}
                className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#172033] truncate max-w-[200px]">{b.resourceName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      b.status === 'active'
                        ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                        : b.status === 'pending'
                        ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                        : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="text-[11px] text-[#64748B] flex items-center justify-between">
                  <span>Borrower: {b.userName}</span>
                  <span>{b.date}</span>
                </div>

                {b.conflictDetected && (
                  <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-[#D97706] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                    Conflict: Overlapping slot detected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerOverviewPage;
