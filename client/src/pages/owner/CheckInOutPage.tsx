import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerBookingsApi, handleCheckInCheckOutApi } from '../../api/owner.api';
import { Booking } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  QrCode,
  LogOut,
  Clock,
  User,
  Cpu,
  Calendar,
  AlertCircle,
  FileText,
  Gauge,
  Check,
  Search,
  X,
} from 'lucide-react';

export const CheckInOutPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<'check_in' | 'check_out'>('check_in');
  const [meterReading, setMeterReading] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getOwnerBookingsApi();
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
  }, []);

  const openActionModal = (booking: Booking, type: 'check_in' | 'check_out') => {
    setSelectedBooking(booking);
    setActionType(type);
    setMeterReading('');
    setConditionNotes('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await handleCheckInCheckOutApi({
        bookingId: selectedBooking._id,
        action: actionType,
        meterReading,
        conditionNotes,
      });

      if (res.success) {
        setSuccessMessage(res.message || `Successfully processed ${actionType === 'check_in' ? 'Check-in' : 'Check-out'}`);
        await fetchBookings();
        setTimeout(() => {
          setSelectedBooking(null);
          setSuccessMessage('');
        }, 1500);
      } else {
        setErrorMessage('Failed to update status');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error executing operation');
    } finally {
      setSubmitting(false);
    }
  };

  const eligibleBookings = bookings.filter((b) => {
    const isRelevantStatus = b.status === 'active' || b.status === 'completed';
    const matchesSearch =
      (b.resourceName || b.resource?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.userName || b.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      b._id.toLowerCase().includes(search.toLowerCase());
    return isRelevantStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-[#1769D2]" />
            Check-in / Check-out Terminal
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Handover inspection, biometric or ID verification, and session lifecycle monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#172033] flex items-center gap-2 shadow-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-[#16834A] animate-pulse" />
            Scanner Ready
          </span>
        </div>
      </div>

      {/* Quick Lookup Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, resource or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:bg-white"
          />
        </div>
        <div className="text-xs text-[#64748B] flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Pending Check-in
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16834A]" /> In Session
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Completed
          </span>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Scanning active schedules..." size="md" />
        </div>
      ) : eligibleBookings.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#172033]">No active check-in sessions</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            There are currently no active or approved bookings scheduled for immediate handover.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eligibleBookings.map((b) => {
            const hasCheckedIn = (b as any).checkedIn;
            const hasCheckedOut = (b as any).checkedOut;
            const resName = b.resourceName || b.resource?.name || 'Academic Asset';
            const userName = b.userName || b.user?.name || 'Borrower';

            return (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-all shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                    <span className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider">
                      #{b._id.slice(-6)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        hasCheckedOut
                          ? 'bg-slate-100 text-[#64748B]'
                          : hasCheckedIn
                          ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                          : 'bg-amber-50 text-[#D97706] border border-amber-200'
                      }`}
                    >
                      {hasCheckedOut ? 'Session Closed' : hasCheckedIn ? 'In-Session' : 'Awaiting Check-in'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#1769D2] shrink-0" />
                      <span className="truncate">{resName}</span>
                    </h3>

                    <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[#172033]">
                        <span className="text-[#64748B] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#64748B]" /> Borrower:
                        </span>
                        <span className="font-semibold">{userName}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#172033]">
                        <span className="text-[#64748B] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#64748B]" /> Start:
                        </span>
                        <span>{b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : b.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-[#172033]">
                        <span className="text-[#64748B] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#64748B]" /> Timeslot:
                        </span>
                        <span>{b.timeSlot}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] flex items-center gap-2">
                  {!hasCheckedIn && (
                    <button
                      onClick={() => openActionModal(b, 'check_in')}
                      className="w-full py-2 px-3 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Sign Check-in
                    </button>
                  )}
                  {hasCheckedIn && !hasCheckedOut && (
                    <button
                      onClick={() => openActionModal(b, 'check_out')}
                      className="w-full py-2 px-3 rounded-lg bg-[#16834A] hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Return
                    </button>
                  )}
                  {hasCheckedOut && (
                    <span className="text-xs text-[#16834A] font-medium flex items-center justify-center gap-1 w-full py-1.5">
                      <Check className="w-4 h-4" /> Fully Reconciled
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Terminal Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    actionType === 'check_in'
                      ? 'bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20'
                      : 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                  }`}
                >
                  {actionType === 'check_in' ? <QrCode className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    {actionType === 'check_in' ? 'Process Check-in' : 'Process Return Handover'}
                  </h3>
                  <p className="text-xs text-[#64748B]">Booking #{selectedBooking._id.slice(-6)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[#16834A] text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#1769D2]" /> Meter / Usage Counter Reading
                </label>
                <input
                  type="text"
                  placeholder="e.g. 142.5 operating hours, 12 cycles"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#1769D2]" /> Condition Notes & Observations
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Note physical condition, calibration status, cleanliness, optical cleanliness..."
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !conditionNotes.trim()}
                  className="px-5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  Confirm {actionType === 'check_in' ? 'Check-in' : 'Return Handover'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CheckInOutPage;
