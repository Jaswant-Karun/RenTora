import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOwnerOverviewApi, deleteOwnerResourceApi } from '../../api/owner.api';
import { OwnerOverviewData } from '../../api/owner.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { getResourceImage, handleImageFallback } from '../../utils/resourceImages';
import {
  Cpu,
  Inbox,
  CheckCircle2,
  PlusCircle,
  QrCode,
  AlertTriangle,
  History,
  Trash2,
  Clock,
} from 'lucide-react';

export const OwnerOverviewPage: React.FC = () => {
  const { toast } = useToast();
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
      toast.success(`Resource "${name}" decommissioned successfully.`);
      await fetchOverview();
    } catch (err) {
      console.error('Error deleting resource:', err);
      toast.error('Failed to decommission resource.');
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

      {/* 7 Core Numerical Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* 1. Total Resources */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Total Assets</span>
            <Cpu className="w-3.5 h-3.5 text-[#1769D2]" />
          </div>
          <p className="text-xl font-bold text-[#172033] mt-1.5">{stats.totalResources ?? stats.totalListedResources ?? 0}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">Catalogued</p>
        </div>

        {/* 2. Available Resources */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#16834A] uppercase">Available</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16834A]" />
          </div>
          <p className="text-xl font-bold text-[#16834A] mt-1.5">{stats.availableResources ?? (myResources.filter(r => r.status === 'available').length)}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">Ready for booking</p>
        </div>

        {/* 3. Currently Booked */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#1769D2] uppercase">In Use</span>
            <Clock className="w-3.5 h-3.5 text-[#1769D2]" />
          </div>
          <p className="text-xl font-bold text-[#1769D2] mt-1.5">{stats.currentlyBookedResources ?? (myResources.filter(r => r.status === 'in_use' || r.status === 'reserved').length)}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">Occupied now</p>
        </div>

        {/* 4. Pending Booking Requests */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#D97706] uppercase">Pending</span>
            <Inbox className="w-3.5 h-3.5 text-[#D97706]" />
          </div>
          <p className="text-xl font-bold text-[#D97706] mt-1.5">{stats.pendingBookingRequests ?? stats.pendingRequestsCount ?? 0}</p>
          <p className="text-[10px] text-[#D97706] mt-0.5">Review needed</p>
        </div>

        {/* 5. Active Reservations */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#172033] uppercase">Active</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1769D2]" />
          </div>
          <p className="text-xl font-bold text-[#172033] mt-1.5">{stats.activeReservations ?? stats.activeBookingsCount ?? 0}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">Valid passes</p>
        </div>

        {/* 6. Completed Bookings */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Completed</span>
            <History className="w-3.5 h-3.5 text-[#64748B]" />
          </div>
          <p className="text-xl font-bold text-[#172033] mt-1.5">{stats.completedBookings ?? stats.completedBookingsCount ?? 0}</p>
          <p className="text-[10px] text-[#64748B] mt-0.5">Sessions logged</p>
        </div>

        {/* 7. Utilization Percentage */}
        <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#1769D2] uppercase">Utilization</span>
            <span className="text-[10px] font-bold text-[#1769D2]">KPI</span>
          </div>
          <p className="text-xl font-bold text-[#1769D2] mt-1.5">{stats.utilizationPercentage ?? stats.utilizationRate ?? '0%'}</p>
          <p className="text-[10px] text-[#16834A] mt-0.5">Operating rate</p>
        </div>
      </div>

      {/* Main Content Grid: Upcoming Reservations & Managed Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Reservations (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1769D2]" />
                Upcoming Reservations
              </h3>
              <p className="text-xs text-[#64748B]">Scheduled borrower sessions and confirmed access passes</p>
            </div>
            <Link to="/owner/requests" className="text-xs text-[#1769D2] font-semibold hover:underline">
              Manage All Requests
            </Link>
          </div>

          <div className="space-y-3">
            {((data.upcomingReservations && data.upcomingReservations.length > 0) ? data.upcomingReservations : recentBookings).slice(0, 5).map((b) => (
              <div
                key={b._id}
                className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm hover:border-[#1769D2]/30 transition-all text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#172033]">{b.resourceName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-[#64748B]">
                      {b.resourceCategory || 'Lab Equipment'}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      b.status === 'approved' || b.status === 'active'
                        ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                        : b.status === 'pending'
                        ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                        : 'bg-slate-100 text-[#64748B]'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[#64748B] pt-1 border-t border-[#E2E8F0]">
                  <div>
                    <span className="font-medium text-[#172033]">Borrower:</span> {b.userName}
                  </div>
                  <div>
                    <span className="font-medium text-[#172033]">Date:</span> {b.date}
                  </div>
                  <div>
                    <span className="font-medium text-[#172033]">Slot:</span> {b.timeSlot}
                  </div>
                </div>

                {b.suggestedAlternative && (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-[#1769D2]">
                    <span className="font-semibold">Alternative Suggested:</span> {b.suggestedAlternative.date} ({b.suggestedAlternative.timeSlot})
                  </div>
                )}

                {b.conflictDetected && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-[#D97706] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                    <span>Booking Conflict: Overlapping reservation detected on this timeslot.</span>
                  </div>
                )}
              </div>
            ))}

            {recentBookings.length === 0 && (
              <div className="py-8 text-center bg-white rounded-xl border border-dashed border-[#E2E8F0]">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-[#64748B]">No active upcoming reservations found.</p>
              </div>
            )}
          </div>

          {/* Managed Resources Summary */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#1769D2]" />
                Managed Facilities ({myResources.length})
              </h3>
              <Link to="/owner/resources" className="text-xs text-[#1769D2] font-semibold hover:underline">
                View All & Edit
              </Link>
            </div>

            <div className="space-y-2.5">
              {myResources.slice(0, 3).map((res) => (
                <div
                  key={res._id}
                  className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getResourceImage(res.images, res.category)}
                      alt={res.name}
                      onError={(e) => handleImageFallback(e, res.category)}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#E2E8F0]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-[#172033] truncate">{res.name}</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          res.status === 'available' ? 'bg-emerald-50 text-[#16834A]' :
                          res.status === 'maintenance' ? 'bg-amber-50 text-[#D97706]' :
                          res.status === 'disabled' ? 'bg-red-50 text-[#DC2626]' :
                          'bg-slate-100 text-[#64748B]'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate">{res.location} • {res.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/dashboard/resources/${res._id}`}
                      className="px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-slate-100 font-medium text-[11px] text-[#172033]"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteResource(res._id, res.name)}
                      className="p-1 text-[#64748B] hover:text-[#DC2626] transition-colors"
                      title="Archive Resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent Activity Log (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <History className="w-4 h-4 text-[#1769D2]" />
                Recent Activity & Audit Trail
              </h3>
              <p className="text-xs text-[#64748B]">Real-time operational events across your resources</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 8).map((act, idx) => (
                  <div key={act.id || idx} className="flex items-start gap-3 text-xs pb-2.5 border-b border-[#E2E8F0] last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-[#1769D2] mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[#172033] truncate">{act.transition.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-[#64748B] shrink-0">
                          {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate">
                        Resource: <span className="text-[#172033] font-medium">{act.resourceName}</span>
                      </p>
                      {act.note && <p className="text-[10px] text-slate-500 italic truncate">"{act.note}"</p>}
                      <p className="text-[10px] text-slate-400">By {act.performedBy} ({act.performedByRole})</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-[#64748B] text-xs">
                No recent activity recorded today.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerOverviewPage;
