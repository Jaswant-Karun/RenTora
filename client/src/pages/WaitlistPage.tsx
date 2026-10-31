import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  Compass,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Info,
  Calendar,
  XCircle,
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { cancelBookingApi } from '../api/booking.api';

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
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Found alternate lab arrangement');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rentora_token');
      const res = await fetch('http://localhost:5000/api/bookings/waitlist', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setWaitlist(data.data);
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
        setToastMessage('Waitlist entry cancelled. Queue position released.');
        setShowCancelModal(false);
        setCancellingId(null);
        await fetchWaitlist();
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error cancelling waitlist entry:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          Transparent Fairness & Standby Queue
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Resource Waiting Lists</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          When high-demand institutional instruments are fully reserved, RENTORA's fairness engine places you in a
          transparent queue. You can see your exact position, estimated release time, and why you were waitlisted.
        </p>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fairness Principles Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <TrendingUp className="w-4 h-4" />
            Configurable Priority Rules
          </div>
          <p className="text-slate-400 text-[11px]">
            Queue position factors in academic thesis tier (PhD/Final Year), departmental alignment, and historical fair-share usage bonus.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
            Anti-Monopolisation Cooldown
          </div>
          <p className="text-slate-400 text-[11px]">
            Users who reserve the same high-demand asset $\ge 3$ times in 14 days are temporarily throttled to guarantee equal peer access.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Instant Automated Promotion
          </div>
          <p className="text-slate-400 text-[11px]">
            The instant a prior borrower completes their session or cancels, the highest-priority standby reservation is confirmed automatically.
          </p>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Scanning institutional standby queues..." size="md" />
        </div>
      ) : waitlist.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No active waiting list reservations</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You do not currently have any waitlisted reservations. All your booked sessions are confirmed and ready for use.
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard/explore"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20"
            >
              <Compass className="w-4 h-4" /> Explore Campus Marketplace
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Your Active Standby Queue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {waitlist.length} Queued
              </span>
            </h2>
            <button
              onClick={fetchWaitlist}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              Refresh Status
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {waitlist.map((item) => (
              <div
                key={item._id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left: Resource Info */}
                <div className="flex items-start gap-4">
                  {item.resourceImage ? (
                    <img
                      src={item.resourceImage}
                      alt={item.resourceName}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-brand-300 border border-slate-800">
                        {item.resourceCategory}
                      </span>
                      {item.monopolisationDetected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Fair-Share Cooldown
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">{item.resourceName}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {item.date} ({item.timeSlot})
                      </span>
                      {item.resourceLocation && <span>📍 {item.resourceLocation}</span>}
                    </div>

                    {/* Transparency Box */}
                    <div className="mt-2 p-3 rounded-2xl bg-slate-950/80 border border-amber-500/20 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                        <Info className="w-3.5 h-3.5" />
                        Why Was I Waitlisted?
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {item.transparencyRationale || item.waitlistReason || 'High campus demand. Queued according to fair allocation priority.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Queue Stats & Actions */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  <div className="text-left lg:text-right space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Live Queue Standing
                    </span>
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-sm font-extrabold">
                      <Clock className="w-4 h-4" />
                      #{item.queuePosition} in Line
                    </div>
                    {item.waitlistPriority && (
                      <span className="block text-[11px] text-indigo-400 font-semibold">
                        Priority Score: {item.waitlistPriority} pts
                      </span>
                    )}
                    {item.estimatedReleaseTime && (
                      <span className="block text-[10px] text-slate-400">
                        Est. Release: {new Date(item.estimatedReleaseTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCancellingId(item._id);
                        setShowCancelModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 border border-slate-700 text-xs font-semibold text-slate-300 transition-all"
                    >
                      Leave Waitlist
                    </button>
                    <Link
                      to="/dashboard/explore"
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white shadow-md shadow-brand-500/20 flex items-center gap-1.5"
                    >
                      <span>Find Similar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Waitlist Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle className="w-5 h-5" />
              Cancel Waiting List Position
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to release your standing in this queue? Other students behind you will be promoted immediately.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Mandatory Stated Reason</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why are you releasing this slot?"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Keep Position
              </button>
              <button
                onClick={handleCancelWaitlist}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistPage;
