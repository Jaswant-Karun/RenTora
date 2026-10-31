import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerBookingsApi } from '../../api/owner.api';
import { Booking } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Cpu,
  Calendar,
  FileText,
  Search,
  Filter,
} from 'lucide-react';

export const OwnerAuditPage: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'approved' | 'rejected' | 'cancelled' | 'completed'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getOwnerBookingsApi();
        if (res.success) {
          setBookings(res.data);
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.resource?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.rejectionReason?.toLowerCase().includes(search.toLowerCase()) ||
      b.cancellationReason?.toLowerCase().includes(search.toLowerCase()) ||
      b._id?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'approved' && b.status === 'active') ||
      (filterType === 'rejected' && b.status === 'rejected') ||
      (filterType === 'cancelled' && b.status === 'cancelled') ||
      (filterType === 'completed' && b.status === 'completed');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-brand-400" />
            Custodian Audit Trail & Governance Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable log of all booking approvals, rejections, cancellations with stated reasons, and session completions.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          Compliant with Institutional ISO 9001 / Research Integrity
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student, equipment, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Action:
          </span>
          {(['all', 'approved', 'rejected', 'cancelled', 'completed'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                filterType === type
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Scanning cryptographic governance ledger..." size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No audit events found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Audit events will populate automatically as reservations are processed, approved, or rejected.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-800">
            {filtered.map((log) => {
              const isApproved = log.status === 'active';
              const isRejected = log.status === 'rejected';
              const isCancelled = log.status === 'cancelled';
              const isCompleted = log.status === 'completed';

              return (
                <div
                  key={log._id}
                  className="p-5 hover:bg-slate-850/40 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isRejected
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : isCancelled
                            ? 'bg-slate-700 text-slate-300'
                            : isCompleted
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        Action: {log.status}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        REF #{log._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(log.updatedAt || log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm font-semibold text-white">
                      <span className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-brand-400 shrink-0" />
                        {log.resource?.name || 'Academic Facility'}
                      </span>
                      <span className="text-slate-500 hidden sm:inline">•</span>
                      <span className="flex items-center gap-2 text-xs text-slate-300 font-normal">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Borrower: <strong>{log.user?.name}</strong> ({log.user?.email})
                      </span>
                    </div>

                    {/* Stated Reasons for Rejection or Cancellation */}
                    {log.rejectionReason && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Official Rejection Justification:</strong> {log.rejectionReason}
                        </div>
                      </div>
                    )}

                    {log.cancellationReason && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>Cancellation Reason:</strong> {log.cancellationReason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right text-xs text-slate-500 shrink-0">
                    <p>
                      Slot: {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-emerald-400">Verifiable Record</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
