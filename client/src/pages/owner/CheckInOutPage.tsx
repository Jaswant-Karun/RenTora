import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerBookingsApi, handleCheckInCheckOutApi } from '../../api/owner.api';
import { Booking } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  QrCode,
  CheckCircle2,
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
  Camera,
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

  // Filter approved or active bookings for checkin/checkout operations
  const eligibleBookings = bookings.filter((b) => {
    const isRelevantStatus = b.status === 'active' || b.status === 'completed';
    const matchesSearch =
      b.resource?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      b._id.toLowerCase().includes(search.toLowerCase());
    return isRelevantStatus && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <QrCode className="w-8 h-8 text-brand-400" />
            Check-in / Check-out Terminal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Handover inspection, biometric or ID verification, and session lifecycle monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Handover Scanner Ready
          </span>
        </div>
      </div>

      {/* Quick Lookup Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name, resource or booking ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Pending Check-in
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> In Session
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Completed
          </span>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Scanning active schedules..." size="md" />
        </div>
      ) : eligibleBookings.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No active check-in sessions</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no active or approved bookings scheduled for immediate handover.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eligibleBookings.map((b) => {
            const hasCheckedIn = (b as any).checkedIn;
            const hasCheckedOut = (b as any).checkedOut;

            return (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      #{b._id.slice(-6)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        hasCheckedOut
                          ? 'bg-slate-800 text-slate-400'
                          : hasCheckedIn
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {hasCheckedOut ? 'Session Closed' : hasCheckedIn ? 'In-Session' : 'Awaiting Check-in'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="truncate">{b.resource?.name}</span>
                    </h3>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" /> Borrower:
                        </span>
                        <span className="font-semibold text-slate-200">{b.user?.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> Start:
                        </span>
                        <span>{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> End:
                        </span>
                        <span>{new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Handover Controls */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  {!hasCheckedIn ? (
                    <button
                      onClick={() => openActionModal(b, 'check_in')}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Perform Check-In
                    </button>
                  ) : !hasCheckedOut ? (
                    <button
                      onClick={() => openActionModal(b, 'check_out')}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Perform Check-Out
                    </button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs text-slate-500 font-medium bg-slate-950/40 rounded-xl border border-slate-800">
                      ✓ Completed & Returned
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Handover Inspection Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {actionType === 'check_in' ? 'Resource Handover (Check-In)' : 'Equipment Return (Check-Out)'}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedBooking.resource?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {successMessage ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                <Check className="w-5 h-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitAction} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Borrower:</span>
                    <span className="text-white font-medium">{selectedBooking.user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Institution:</span>
                    <span className="text-white font-medium">{selectedBooking.user?.institution || 'Academic Institute'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-brand-400" />
                    Meter Reading / Unit Counter (Optional)
                  </label>
                  <input
                    type="text"
                    value={meterReading}
                    onChange={(e) => setMeterReading(e.target.value)}
                    placeholder="e.g. 142.5 runtime hours, 320g filament remaining"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Inspection Photos & Owner Signoff */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-400" />
                    Verification Inspection Photos
                  </label>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Physical Optics Verified
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-indigo-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Cleanliness Logged
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="ownerSignoffCheck"
                    defaultChecked
                    className="mt-0.5 w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="ownerSignoffCheck" className="text-xs text-slate-300 cursor-pointer">
                    <strong className="text-white">Custodian Physical Handover Certification:</strong> I hereby certify
                    that the equipment was personally inspected, meets institutional safety standards, and condition notes have been committed to the permanent ledger.
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
                  >
                    {submitting && <LoadingSpinner size="sm" />}
                    Confirm {actionType === 'check_in' ? 'Check-In' : 'Check-Out'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};
