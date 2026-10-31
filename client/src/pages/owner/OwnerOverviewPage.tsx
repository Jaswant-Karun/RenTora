import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOwnerOverviewApi, deleteOwnerResourceApi } from '../../api/owner.api';
import { OwnerOverviewData } from '../../api/owner.api';
import { Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Cpu,
  Inbox,
  CheckCircle2,
  Clock,
  PlusCircle,
  QrCode,
  AlertTriangle,
  Activity,
  History,
  Trash2,
  Calendar,
  Building,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const OwnerOverviewPage: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 border border-slate-800 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-[10px] font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            Resource Custodian Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Equipment & Laboratory Custodian Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Monitor incoming reservation requests, resolve timeslot conflicts, track equipment check-ins, and inspect condition logs.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/owner/add-resource"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New Resource</span>
            </Link>
            <Link
              to="/owner/requests"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
            >
              <Inbox className="w-4 h-4" />
              <span>Review Requests ({stats.pendingRequestsCount})</span>
            </Link>
            <Link
              to="/owner/checkin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all"
            >
              <QrCode className="w-4 h-4" />
              <span>Check-in / Check-out</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Widget */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-400">Total Operating Hours</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{stats.totalHoursLogged} hrs</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-400">Campus Utilization</span>
            <span className="font-mono font-bold text-brand-400 text-sm">{stats.utilizationRate}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-slate-400">Active Incidents</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{stats.activeIncidents}</span>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">My Listed Resources</span>
            <Cpu className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{stats.totalListedResources}</p>
          <p className="text-xs text-slate-400 mt-1">Federated across campus</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Requests</span>
            <Inbox className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">{stats.pendingRequestsCount}</p>
          <p className="text-xs text-amber-400 mt-1">Action required</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Bookings</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{stats.activeBookingsCount}</p>
          <p className="text-xs text-emerald-400 mt-1">Passes activated</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Completed Sessions</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">{stats.completedBookingsCount}</p>
          <p className="text-xs text-cyan-400 mt-1">Fully checked out & logged</p>
        </div>
      </div>

      {/* Main Grid: My Listed Resources & Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Listed Resources (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white">My Managed Facilities & Equipment</h3>
              <p className="text-xs text-slate-400">Live catalogue entries under your departmental custody</p>
            </div>
            <Link to="/owner/add-resource" className="text-xs text-brand-400 font-bold hover:underline">
              + Add Resource
            </Link>
          </div>

          <div className="space-y-3">
            {myResources.map((res) => (
              <div
                key={res._id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={res.images?.[0]}
                    alt={res.name}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-800"
                  />
                  <div className="min-w-0 space-y-0.5 text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-brand-300 border border-slate-800">
                      {res.category}
                    </span>
                    <h4 className="font-bold text-white truncate text-sm">{res.name}</h4>
                    <p className="text-slate-400 truncate">{res.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/dashboard/resources/${res._id}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDeleteResource(res._id, res.name)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
              <h3 className="text-base font-extrabold text-white">Recent Requests & Bookings</h3>
              <p className="text-xs text-slate-400">Incoming borrower reservation passes</p>
            </div>
            <Link to="/owner/requests" className="text-xs text-brand-400 font-bold hover:underline">
              View all ({stats.pendingRequestsCount})
            </Link>
          </div>

          <div className="space-y-3">
            {recentBookings.slice(0, 4).map((b) => (
              <div
                key={b._id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[200px]">{b.resourceName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      b.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : b.status === 'pending'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Borrower: {b.userName}</span>
                  <span>{b.date}</span>
                </div>

                {b.conflictDetected && (
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
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
