import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBookingsApi, cancelBookingApi } from '../api/booking.api';
import { Booking } from '../types/resource';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { BookingTimeline } from '../components/booking/BookingTimeline';
import { UserCheckInOutModal } from '../components/booking/UserCheckInOutModal';
import { IncidentReportModal } from '../components/incident/IncidentReportModal';
import {
  CalendarCheck,
  Clock,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Compass,
  ArrowRight,
  Filter,
  QrCode,
  LogOut,
  AlertTriangle,
  History,
  Info,
  ShieldAlert,
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBookingForHandover, setSelectedBookingForHandover] = useState<Booking | null>(null);
  const [selectedIncidentBooking, setSelectedIncidentBooking] = useState<Booking | null>(null);
  const [handoverMode, setHandoverMode] = useState<'check_in' | 'return'>('check_in');

  // Cancel Modal State
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookingsApi(statusFilter !== 'all' ? statusFilter : undefined);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleOpenCancelModal = (id: string) => {
    setCancelBookingId(id);
    setCancelReason('');
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingId || !cancelReason.trim()) return;

    setCancelling(true);
    try {
      const res = await cancelBookingApi(cancelBookingId, cancelReason.trim());
      if (res.success) {
        setCancelBookingId(null);
        await fetchBookings();
      }
    } catch (err) {
      console.error('Error cancelling reservation:', err);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (b: Booking) => {
    if (b.status === 'overdue' || b.isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </span>
      );
    }

    switch (b.status) {
      case 'approved':
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Approved Pass
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse">
            <QrCode className="w-3 h-3" />
            In Session
          </span>
        );
      case 'return_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <LogOut className="w-3 h-3" />
            Return Pending
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending Custodian Review
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Info className="w-3 h-3" />
            Under Active Review
          </span>
        );
      case 'waitlisted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Waitlisted
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <span>{b.status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-[10px] font-bold uppercase tracking-wider">
            <CalendarCheck className="w-3.5 h-3.5" />
            End-to-End Booking Lifecycle Terminal
          </div>
          <h1 className="text-2xl font-extrabold text-white">My Academic Reservations</h1>
          <p className="text-xs text-slate-400">
            Track visual progress timelines, perform check-ins, record handover conditions, and log returns.
          </p>
        </div>

        <Link
          to="/dashboard/explore"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Book New Asset</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Bookings' },
          { key: 'active', label: 'Approved & Active' },
          { key: 'pending', label: 'Pending / Review' },
          { key: 'waitlisted', label: 'Waitlisted' },
          { key: 'completed', label: 'Completed' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'cancelled', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Querying live booking timelines & audit telemetry..." size="lg" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No bookings found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any bookings matching this filter. Explore the marketplace to reserve lab instruments.
          </p>
          <Link
            to="/dashboard/explore"
            className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs mt-2"
          >
            Explore Resources
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const canCheckIn =
              (booking.status === 'approved' || booking.status === 'active') && !booking.checkedIn;
            const canInitiateReturn = booking.status === 'checked_in' && !booking.returnInitiated;
            const canCancel = ['pending', 'under_review', 'approved', 'active', 'waitlisted'].includes(
              booking.status
            );

            return (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/80 transition-all shadow-xl space-y-5"
              >
                {/* Header Information */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        booking.resourceImage ||
                        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'
                      }
                      alt={booking.resourceName}
                      className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-800 shadow-md"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-brand-300 border border-slate-800">
                          {booking.resourceCategory}
                        </span>
                        {getStatusBadge(booking)}
                      </div>
                      <h3
                        onClick={() => navigate(`/dashboard/resources/${booking.resourceId}`)}
                        className="text-base font-bold text-white hover:text-brand-300 cursor-pointer transition-colors"
                      >
                        {booking.resourceName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-xs">
                        <span className="flex items-center gap-1.5 text-white font-medium">
                          <Calendar className="w-3.5 h-3.5 text-brand-400" />
                          {booking.date}
                        </span>
                        <span className="flex items-center gap-1.5 text-white font-medium">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          {booking.timeSlot} ({booking.durationHours || 1} hrs)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {booking.resourceLocation}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right Quick Action Buttons */}
                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    {canCheckIn && (
                      <button
                        onClick={() => {
                          setSelectedBookingForHandover(booking);
                          setHandoverMode('check_in');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all"
                      >
                        <QrCode className="w-4 h-4" />
                        Check-In & Start Session
                      </button>
                    )}

                    {canInitiateReturn && (
                      <button
                        onClick={() => {
                          setSelectedBookingForHandover(booking);
                          setHandoverMode('return');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Initiate Return & Condition Log
                      </button>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => handleOpenCancelModal(booking._id)}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                      >
                        Cancel Reservation
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedIncidentBooking(booking)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Report damage, missing parts, scheduling collision or safety issue"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Report Issue</span>
                    </button>
                  </div>
                </div>

                {/* Purpose & Project Details */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-xs space-y-1">
                  <p className="text-slate-300">
                    <strong className="text-white">Research Purpose:</strong> {booking.purpose}
                  </p>
                  {booking.projectDescription && (
                    <p className="text-slate-400">
                      <strong className="text-slate-300">Project Protocol:</strong> {booking.projectDescription}
                    </p>
                  )}
                  {booking.supervisorName && (
                    <p className="text-[11px] text-slate-500">
                      Faculty Sponsor: <strong className="text-slate-400">{booking.supervisorName}</strong>
                    </p>
                  )}
                </div>

                {/* Visual 5-Stage Timeline Track & Audit Trail */}
                <BookingTimeline booking={booking} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Handover Check-In / Return Modal */}
      {selectedBookingForHandover && (
        <UserCheckInOutModal
          booking={selectedBookingForHandover}
          mode={handoverMode}
          isOpen={!!selectedBookingForHandover}
          onClose={() => setSelectedBookingForHandover(null)}
          onSuccess={async () => {
            await fetchBookings();
          }}
        />
      )}

      {/* Mandatory Cancellation Reason Modal */}
      {cancelBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertCircle className="w-5 h-5" />
                Cancel Equipment Reservation
              </div>
              <button
                onClick={() => setCancelBookingId(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <p className="text-xs text-slate-300">
                Please enter a reason for cancelling this reservation. This will be recorded into the institutional
                audit ledger and the timeslot will be immediately offered to waiting researchers.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cancellation Reason (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Experiment sample delayed from vendor, rescheduled with advisor..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelBookingId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Keep Reservation
                </button>
                <button
                  type="submit"
                  disabled={cancelling || !cancelReason.trim()}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-rose-500/20"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Incident Report Modal */}
      {selectedIncidentBooking && (
        <IncidentReportModal
          isOpen={!!selectedIncidentBooking}
          onClose={() => setSelectedIncidentBooking(null)}
          defaultBookingId={selectedIncidentBooking._id}
          defaultBookingRef={`BK-${selectedIncidentBooking._id.slice(-6).toUpperCase()}`}
          defaultResourceId={selectedIncidentBooking.resourceId}
          defaultResourceName={selectedIncidentBooking.resourceName}
          onSuccess={() => fetchBookings()}
        />
      )}
    </div>
  );
};

export default MyBookingsPage;
