import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getOwnerBookingsApi,
  approveBookingApi,
  rejectBookingApi,
  cancelBookingByOwnerApi,
  moveBookingToWaitlistApi,
} from '../../api/owner.api';
import { Booking } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Building,
  Calendar,
  ShieldCheck,
  RotateCcw,
  History,
  AlertCircle,
  X,
  Phone,
  Mail,
  HelpCircle,
} from 'lucide-react';

export const OwnerBookingsPage: React.FC<{ initialTab?: string }> = ({ initialTab = 'requests' }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Reject / Cancel Modal states
  const [modalMode, setModalMode] = useState<'reject' | 'cancel' | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getOwnerBookingsApi();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching owner bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await approveBookingApi(id);
      setActionFeedback(res.message);
      await fetchBookings();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error approving booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWaitlist = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await moveBookingToWaitlistApi(id);
      setActionFeedback(res.message);
      await fetchBookings();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error moving to waiting list');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (b: any) => {
    setSelectedBooking(b);
    setModalMode('reject');
    setModalReason('');
    setModalError(null);
  };

  const openCancelModal = (b: any) => {
    setSelectedBooking(b);
    setModalMode('cancel');
    setModalReason('');
    setModalError(null);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalReason.trim()) {
      setModalError('Please specify a detailed reason for this action.');
      return;
    }

    if (!selectedBooking) return;

    setActionLoading(selectedBooking._id);
    try {
      if (modalMode === 'reject') {
        const res = await rejectBookingApi(selectedBooking._id, modalReason);
        setActionFeedback(res.message);
      } else if (modalMode === 'cancel') {
        const res = await cancelBookingByOwnerApi(selectedBooking._id, modalReason);
        setActionFeedback(res.message);
      }
      setModalMode(null);
      setSelectedBooking(null);
      await fetchBookings();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Operation failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter bookings based on activeTab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'requests') return b.status === 'pending';
    if (activeTab === 'approved') return b.status === 'active';
    if (activeTab === 'waitlist') return b.status === 'waitlisted';
    if (activeTab === 'history') return b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected';
    return true;
  });

  const pendingRequestsCount = bookings.filter((b) => b.status === 'pending').length;
  const approvedCount = bookings.filter((b) => b.status === 'active').length;
  const waitlistCount = bookings.filter((b) => b.status === 'waitlisted').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-[10px] font-bold uppercase tracking-wider">
          <Inbox className="w-3.5 h-3.5" />
          Custodian Booking Hub
        </div>
        <h1 className="text-2xl font-extrabold text-white">Booking Requests & Approval Governance</h1>
        <p className="text-xs text-slate-400">
          Review borrower eligibility credentials, detect scheduling conflicts, approve reservation passes, or manage priority waitlists.
        </p>
      </div>

      {actionFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionFeedback}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'requests'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Incoming Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'approved'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Approved Bookings ({approvedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'waitlist'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Waiting List ({waitlistCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Booking History</span>
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Loading reservation records and checking scheduling conflicts..." size="lg" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
          <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
          <p>No bookings found in this view category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <motion.div
              key={b._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border transition-all space-y-4 shadow-xl ${
                b.conflictDetected
                  ? 'bg-amber-950/20 border-amber-500/50'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              {/* Conflict Alert Banner if detected */}
              {b.conflictDetected && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Scheduling Conflict Detected:</strong> Another reservation request overlaps with this date & timeslot.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 px-2 py-0.5 rounded">
                    Dual Booking
                  </span>
                </div>
              )}

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Resource Info */}
                <div className="flex items-start gap-4">
                  <img
                    src={b.resourceImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                    alt={b.resourceName}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-brand-300 border border-slate-800">
                        {b.resourceCategory}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        Status: {b.status}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">{b.resourceName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <Calendar className="w-3.5 h-3.5 text-brand-400" />
                        {b.date}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        {b.timeSlot}
                      </span>
                      <span>{b.resourceLocation}</span>
                    </div>
                  </div>
                </div>

                {/* User Information Card */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1 min-w-[260px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> Borrower Profile
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      {b.userEligibility || 'Verified Student'}
                    </span>
                  </div>
                  <p className="font-extrabold text-white text-sm">{b.userName}</p>
                  <p className="text-slate-400 text-[11px] truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500" />
                    {b.userEmail}
                  </p>
                  <p className="text-slate-400 text-[11px] truncate">
                    {b.userDepartment || 'General Faculty'} • {b.userInstitution || 'NIT'}
                  </p>
                </div>
              </div>

              {/* Research Purpose & Supervisor */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Stated Project Purpose</span>
                <p className="text-slate-300 leading-relaxed">{b.purpose}</p>
                {b.supervisorName && (
                  <p className="text-[11px] text-brand-400 font-semibold pt-1">
                    Faculty Sponsor / Endorser: {b.supervisorName}
                  </p>
                )}
                {b.rejectionReason && (
                  <p className="text-[11px] text-rose-400 font-semibold pt-1">
                    Declined Rationale: {b.rejectionReason}
                  </p>
                )}
                {b.cancellationReason && (
                  <p className="text-[11px] text-amber-400 font-semibold pt-1">
                    Cancellation Reason: {b.cancellationReason}
                  </p>
                )}
              </div>

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                {b.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={actionLoading === b._id}
                      onClick={() => handleApprove(b._id)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Approve Request
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRejectModal(b)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Reject with Reason
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleWaitlist(b._id)}
                      leftIcon={<Clock className="w-4 h-4" />}
                    >
                      Move to Waitlist
                    </Button>
                  </>
                )}

                {b.status === 'active' && (
                  <>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mr-auto">
                      <CheckCircle2 className="w-4 h-4" /> Active Access Pass Granted
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openCancelModal(b)}
                    >
                      Cancel Booking with Reason
                    </Button>
                  </>
                )}

                {b.status === 'waitlisted' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApprove(b._id)}
                  >
                    Promote & Activate Pass
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject or Cancel Modal */}
      <AnimatePresence>
        {modalMode && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setModalMode(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-extrabold text-white">
                  {modalMode === 'reject' ? 'Reject Booking Request' : 'Cancel Confirmed Reservation'}
                </h3>
              </div>

              <p className="text-xs text-slate-400">
                Please provide an explicit rationale for this action. This explanation will be logged in the institutional audit trail and communicated to{' '}
                <strong className="text-white">{selectedBooking.userName}</strong>.
              </p>

              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Reason & Rationale <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      modalMode === 'reject'
                        ? 'e.g. Laser safety clearance level 2 certificate missing in profile...'
                        : 'e.g. Emergency calibration maintenance scheduled by lab in-charge...'
                    }
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    required
                    className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700 p-3 text-xs focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setModalMode(null)}>
                    Dismiss
                  </Button>
                  <Button
                    type="submit"
                    variant={modalMode === 'reject' ? 'outline' : 'danger'}
                    size="sm"
                    isLoading={actionLoading === selectedBooking._id}
                  >
                    Confirm {modalMode === 'reject' ? 'Rejection' : 'Cancellation'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OwnerBookingsPage;
