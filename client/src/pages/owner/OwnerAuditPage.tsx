import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerBookingsApi } from '../../api/owner.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Cpu,
  Calendar,
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
      (b.resourceName || b.resource?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.userName || b.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.rejectionReason || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.cancellationReason || '').toLowerCase().includes(search.toLowerCase()) ||
      b._id.toLowerCase().includes(search.toLowerCase());

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
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#1769D2]" />
            Custodian Audit Trail & Governance Log
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Immutable log of all booking approvals, rejections, cancellations with stated reasons, and session completions.
          </p>
        </div>
        <div className="text-xs font-mono text-[#64748B] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg shadow-sm">
          Institutional Governance & Compliance Log
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student, equipment, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
          <span className="text-xs text-[#64748B] flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Action:
          </span>
          {(['all', 'approved', 'rejected', 'cancelled', 'completed'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors shrink-0 ${
                filterType === type
                  ? 'bg-[#1769D2] text-white shadow-sm'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Entries List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Querying governance log..." size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white">
          <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#172033]">No audit history found</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            All reservation approvals, rejections, cancellations, and completed checkouts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const resName = item.resourceName || item.resource?.name || 'Academic Asset';
            const userName = item.userName || item.user?.name || 'Borrower';

            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm hover:shadow transition-all space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                          : item.status === 'rejected'
                          ? 'bg-red-50 text-[#DC2626] border border-red-200'
                          : item.status === 'cancelled'
                          ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                          : 'bg-slate-100 text-[#64748B]'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="font-mono text-[#64748B] text-[11px]">#{item._id.slice(-8)}</span>
                    <span className="font-semibold text-[#172033] flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-[#1769D2]" /> {resName}
                    </span>
                  </div>

                  <span className="text-[#64748B] text-[11px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[#64748B] text-[11px] pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#64748B]" />
                    Requester: <strong className="text-[#172033] font-medium">{userName}</strong>
                  </span>
                  <span>Date: {item.date}</span>
                  <span>Timeslot: {item.timeSlot}</span>
                </div>

                {item.rejectionReason && (
                  <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-200 text-[#DC2626] text-[11px]">
                    <strong>Rejection Rationale:</strong> {item.rejectionReason}
                  </div>
                )}

                {item.cancellationReason && (
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[#D97706] text-[11px]">
                    <strong>Cancellation Reason:</strong> {item.cancellationReason}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerAuditPage;
