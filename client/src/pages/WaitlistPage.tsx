import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Compass,
  CheckCircle2,
  TrendingUp,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { cancelBookingApi, getWaitlistBookingsApi } from '../api/booking.api';
import { useToast } from '../context/ToastContext';

interface WaitlistItem {
  _id: string;
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  resourceLocation?: string;
  resourceImage?: string;
  date: string;
  timeSlot: string;
  queuePosition: number;
  waitlistPriority?: number;
  waitlistReason?: string;
  transparencyRationale?: string;
  estimatedReleaseTime?: string;
  monopolisationDetected?: boolean;
  createdAt: string;
}

export const WaitlistPage: React.FC = () => {
  const { toast } = useToast();
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Found alternate lab arrangement');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await getWaitlistBookingsApi();
      if (res.success) {
        setWaitlist(res.data);
      }
    } catch (err) {
      console.error('Error loading waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleCancelWaitlist = async () => {
    if (!cancellingId) return;
    try {
      const res = await cancelBookingApi(cancellingId, cancelReason);
      if (res.success) {
        toast.success('Waitlist entry cancelled. Queue position released.');
        setShowCancelModal(false);
        setCancellingId(null);
        await fetchWaitlist();
      }
    } catch (err) {
      console.error('Error cancelling waitlist entry:', err);
      toast.error('Could not cancel waitlist entry');
    }
  };

  return (
    <div className="space-y-6">

      {/* 1. Header Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Transparent Standby Waiting Lists
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Transparent priority standby queues with automatic promotion when equipment becomes available.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchWaitlist}
            className="p-2 text-[#64748B] hover:text-[#172033] rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors"
            title="Refresh queue standing"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/dashboard/explore"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-xs transition-colors shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </div>

      {/* 2. Transparency Policy Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1769D2]">
            <TrendingUp className="w-4 h-4" />
            <span>Configurable Priority Rules</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Queue standing prioritizes academic research level, thesis urgency, and historical fair usage.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D97706]">
            <Clock className="w-4 h-4" />
            <span>Anti-Monopolisation Rules</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            Repeated bookings of the same asset trigger cooldown windows to guarantee fair peer access.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#16834A]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Automated Promotion</span>
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            When a prior borrower cancels or finishes early, the highest-priority request is confirmed immediately.
          </p>
        </div>
      </div>

      {/* 3. Waitlist Cards List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Scanning institutional standby queues..." size="md" />
        </div>
      ) : waitlist.length === 0 ? (
        <EmptyState
          title="No active waitlist reservations"
          description="You do not currently have any waitlisted reservations. All your confirmed bookings are active."
          actionLabel="Explore Campus Marketplace"
          onAction={() => window.location.href = '/dashboard/explore'}
        />
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
            <span>Your Standby Positions</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-blue-200">
              {waitlist.length} Queued
            </span>
          </h2>

          <div className="grid grid-cols-1 gap-3">
            {waitlist.map((item) => (
              <div
                key={item._id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#CBD5E1] transition-colors"
              >
                <div className="flex items-start sm:items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1769D2] border border-blue-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] uppercase font-bold text-[#64748B]">POS</span>
                    <span className="text-sm font-bold text-[#1769D2] leading-none">#{item.queuePosition}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#172033]">{item.resourceName}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {item.date} • {item.timeSlot} • {item.resourceCategory}
                    </p>
                    {item.waitlistReason && (
                      <p className="text-[11px] text-[#64748B] mt-1 bg-[#F8FAFC] p-1.5 rounded border border-[#E2E8F0]">
                        <strong>Why you were waitlisted:</strong> {item.waitlistReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingId(item._id);
                      setShowCancelModal(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-[#DC2626] hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                  >
                    Leave Queue
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#172033]">Leave Standby Waitlist</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Your position in the queue will be surrendered.</p>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#172033]">
                Reason for Leaving Queue
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg p-2.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Position
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelWaitlist}
              >
                Surrender Position
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistPage;
