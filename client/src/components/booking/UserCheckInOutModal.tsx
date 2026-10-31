import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Booking } from '../../types/resource';
import { checkInBookingApi, initiateReturnApi } from '../../api/booking.api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  QrCode,
  LogOut,
  Gauge,
  FileText,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

interface UserCheckInOutModalProps {
  booking: Booking;
  mode: 'check_in' | 'return';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UserCheckInOutModal: React.FC<UserCheckInOutModalProps> = ({
  booking,
  mode,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isCheckIn = mode === 'check_in';
  const [conditionNotes, setConditionNotes] = useState(
    isCheckIn
      ? 'Equipment inspected and clean before start of research run.'
      : 'Session concluded. Cleaned work area, purged lines, equipment returned in operational order.'
  );
  const [meterReading, setMeterReading] = useState(isCheckIn ? '124.0 hrs' : '127.5 hrs');
  const [cleanliness, setCleanliness] = useState<'passed' | 'needs_cleaning'>('passed');
  const [operationalStatus, setOperationalStatus] = useState<'optimal' | 'minor_wear' | 'damaged' | 'offline'>('optimal');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isCheckIn) {
        const res = await checkInBookingApi(booking._id, {
          conditionNotes,
          meterReading,
          cleanliness,
          operationalStatus,
        });
        if (res.success) {
          setSuccessMessage('Check-in confirmed! Initial condition recorded in institutional log.');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        const res = await initiateReturnApi(booking._id, {
          conditionNotes,
          meterReading,
          cleanliness,
          operationalStatus,
        });
        if (res.success) {
          setSuccessMessage('Return initiated! Custodian notified for handover inspection.');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error processing status update.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                isCheckIn
                  ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-md shadow-brand-500/20'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-md shadow-indigo-500/20'
              }`}
            >
              {isCheckIn ? <QrCode className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isCheckIn ? 'Session Check-In & Handover' : 'Initiate Return & Equipment Inspection'}
              </h3>
              <p className="text-xs text-slate-400">{booking.resourceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-brand-400" />
                  Meter Reading / Counter
                </label>
                <input
                  type="text"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                  placeholder="e.g. 142.5 hrs"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operational State</label>
                <select
                  value={operationalStatus}
                  onChange={(e) => setOperationalStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="optimal">Optimal / Pristine</option>
                  <option value="minor_wear">Minor Wear Detected</option>
                  <option value="damaged">Damaged / Issue Noted</option>
                  <option value="offline">Offline / Fault Alarm</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-400" />
                {isCheckIn ? 'Initial Inspection Observations' : 'Return Condition & Cleaning Notes'}
              </label>
              <textarea
                rows={3}
                required
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="Detail optical state, cleaning performed, and calibration..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
              >
                {submitting && <LoadingSpinner size="sm" />}
                Confirm {isCheckIn ? 'Check-In' : 'Return Initiation'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
