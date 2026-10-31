import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getOwnerBookingsApi,
  approveBookingApi,
  rejectBookingApi,
  cancelBookingByOwnerApi,
  moveBookingToWaitlistApi,
} from '../../api/owner.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { BookingTimeline } from '../../components/booking/BookingTimeline';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Calendar,
  ShieldCheck,
  History,
  AlertCircle,
  X,
  Mail,
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
      setModalError('Please specify an operational rationale.');
      return;
    }

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
      <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 text-[10px] font-semibold uppercase tracking-wider">
          <Inbox className="w-3.5 h-3.5" />
          Custodian Booking Hub
        </div>
        <h1 className="text-2xl font-bold text-[#172033]">Booking Requests & Approval Governance</h1>
        <p className="text-xs text-[#64748B]">
          Review borrower eligibility credentials, detect scheduling conflicts, approve reservation passes, or manage priority waitlists.
        </p>
      </div>

      {actionFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16834A] text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-[#16834A] shrink-0" />
          <span>{actionFeedback}</span>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'requests'
              ? 'bg-[#1769D2] text-white shadow-sm'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Incoming Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-[#D97706]">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'approved'
              ? 'bg-[#1769D2] text-white shadow-sm'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Approved Bookings ({approvedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('waitlist')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'waitlist'
              ? 'bg-[#1769D2] text-white shadow-sm'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Waiting List ({waitlistCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'bg-[#1769D2] text-white shadow-sm'
              : 'bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
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
        <div className="p-12 text-center rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] space-y-2">
          <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
          <p>No bookings found in this view category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <motion.div
              key={b._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border transition-all space-y-4 shadow-sm ${
                b.conflictDetected
                  ? 'bg-amber-50/40 border-amber-300'
                  : 'bg-white border-[#E2E8F0]'
              }`}
            >
              {/* Conflict Alert Banner if detected */}
              {b.conflictDetected && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-[#D97706]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>
                      <strong>Scheduling Conflict:</strong> Another reservation overlaps with this date & timeslot.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">
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
                    className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#E2E8F0]"
                  />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                        {b.resourceCategory}
                      </span>
                      <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B]">
                        Status: {b.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#172033]">{b.resourceName}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#64748B] text-xs">
                      <span className="flex items-center gap-1 font-medium text-[#172033]">
                        <Calendar className="w-3.5 h-3.5 text-[#1769D2]" />
                        {b.date}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[#172033]">
                        <Clock className="w-3.5 h-3.5 text-[#1769D2]" />
                        {b.timeSlot}
                      </span>
                      <span>{b.resourceLocation}</span>
                    </div>
                  </div>
                </div>

                {/* User Information Card */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1 min-w-[260px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-[#64748B] flex items-center gap-1">
                      <User className="w-3 h-3" /> Borrower Profile
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#16834A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      {b.userEligibility || 'Verified Student'}
                    </span>
                  </div>
                  <p className="font-bold text-[#172033] text-sm">{b.userName}</p>
                  <p className="text-[#64748B] text-[11px] truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-[#64748B]" />
                    {b.userEmail}
                  </p>
                  <p className="text-[#64748B] text-[11px] truncate">
                    {b.userDepartment || 'General Faculty'} • {b.userInstitution || 'NIT'}
                  </p>
                </div>
              </div>

              {/* Research Purpose & Supervisor */}
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#64748B] block">Stated Project Purpose</span>
                <p className="text-[#172033] leading-relaxed">{b.purpose}</p>
                {b.supervisorName && (
                  <p className="text-[11px] text-[#1769D2] font-medium pt-1">
                    Faculty Sponsor / Endorser: {b.supervisorName}
                  </p>
                )}
                {b.rejectionReason && (
                  <p className="text-[11px] text-[#DC2626] font-medium pt-1">
                    Declined Rationale: {b.rejectionReason}
                  </p>
                )}
                {b.cancellationReason && (
                  <p className="text-[11px] text-[#D97706] font-medium pt-1">
                    Cancellation Reason: {b.cancellationReason}
                  </p>
                )}
              </div>

              {/* Visual Lifecycle Stepper & Audit Log */}
              <BookingTimeline booking={b} />

              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
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
                    <span className="text-xs text-[#16834A] font-semibold flex items-center gap-1.5 mr-auto">
                      <CheckCircle2 className="w-4 h-4" /> Active Access Pass Granted
                    </span>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openCancelModal(b)}
                    >
                      Cancel Booking
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setModalMode(null)}
                className="absolute top-4 right-4 p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                <h3 className="text-base font-bold text-[#172033]">
                  {modalMode === 'reject' ? 'Reject Booking Request' : 'Cancel Confirmed Reservation'}
                </h3>
              </div>

              <p className="text-xs text-[#64748B]">
                Please provide an explicit rationale for this action. This explanation will be logged in the audit trail and communicated to{' '}
                <strong className="text-[#172033]">{selectedBooking.userName}</strong>.
              </p>

              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#172033]">
                    Reason & Rationale <span className="text-[#DC2626]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      modalMode === 'reject'
                        ? 'e.g. Safety clearance level 2 certificate missing in profile...'
                        : 'e.g. Emergency calibration maintenance scheduled by lab in-charge...'
                    }
                    value={modalReason}
                    onChange={(e) => setModalReason(e.target.value)}
                    required
                    className="w-full bg-white text-[#172033] placeholder-[#64748B] rounded-xl border border-[#E2E8F0] p-3 text-xs focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
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
