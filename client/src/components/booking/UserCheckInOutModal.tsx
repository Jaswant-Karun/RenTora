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
  Check,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Clock,
  X,
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
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  ]);
  const [userConfirmed, setUserConfirmed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleAddPhotoPreset = (url: string) => {
    if (!photos.includes(url)) {
      setPhotos([...photos, url]);
    }
  };

  const handleRemovePhoto = (url: string) => {
    setPhotos(photos.filter((p) => p !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userConfirmed) {
      setErrorMessage('You must confirm that this condition documentation is accurate.');
      return;
    }

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
          photos,
          userConfirmation: userConfirmed,
        } as any);
        if (res.success) {
          setSuccessMessage('Check-in confirmed! Condition photos & sign-off recorded in ledger.');
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
          photos,
          userConfirmation: userConfirmed,
        } as any);
        if (res.success) {
          setSuccessMessage('Return handover logged! Custodian notified for final inspection.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCheckIn
                  ? 'bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20'
                  : 'bg-emerald-50 text-[#16834A] border border-emerald-200'
              }`}
            >
              {isCheckIn ? <QrCode className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#172033]">
                {isCheckIn ? 'Session Check-In & Inspection' : 'Return Handover & Inspection'}
              </h3>
              <p className="text-xs text-[#64748B]">{booking.resourceName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16834A] text-sm flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Timestamp Notice */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5 text-[#172033] font-medium">
                <Clock className="w-3.5 h-3.5 text-[#1769D2]" />
                Verification Timestamp:
              </span>
              <span className="font-mono text-[#172033] text-[11px]">{new Date().toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-[#1769D2]" />
                  Meter Reading
                </label>
                <input
                  type="text"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                  placeholder="e.g. 142.5 hrs"
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Operational State</label>
                <select
                  value={operationalStatus}
                  onChange={(e) => setOperationalStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                >
                  <option value="optimal">Optimal / Pristine</option>
                  <option value="minor_wear">Minor Wear Detected</option>
                  <option value="damaged">Damaged / Issue Noted</option>
                  <option value="offline">Offline / Fault Alarm</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1769D2]" />
                {isCheckIn ? 'Initial Inspection Notes (Mandatory)' : 'Return Condition & Cleaning Notes (Mandatory)'}
              </label>
              <textarea
                rows={3}
                required
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                placeholder="Detail optical state, cleaning performed, and calibration status..."
                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
              />
            </div>

            {/* Condition Documentation Photos */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#172033] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#1769D2]" />
                  Condition Verification Photos ({photos.length} Attached)
                </span>
                <span className="text-[10px] text-[#64748B]">Institutional upload simulator</span>
              </label>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-[#E2E8F0] group h-20">
                      <img src={url} alt={`Inspection #${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(url)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-[#DC2626] hover:bg-white text-[10px] shadow"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleAddPhotoPreset(
                      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#172033] hover:bg-slate-100 flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3 text-[#1769D2]" />
                  + Optical Surface
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddPhotoPreset(
                      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#172033] hover:bg-slate-100 flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3 text-[#1769D2]" />
                  + Power Meter
                </button>
              </div>
            </div>

            {/* Mandatory User Confirmation Checkbox */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3">
              <input
                type="checkbox"
                id="userConfirmationCheck"
                checked={userConfirmed}
                onChange={(e) => setUserConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#1769D2] border-[#E2E8F0] focus:ring-[#1769D2]"
              />
              <label htmlFor="userConfirmationCheck" className="text-xs text-[#64748B] cursor-pointer leading-relaxed">
                <strong className="text-[#172033]">Borrower Sign-Off Confirmation:</strong> I confirm that this condition
                documentation and physical status note accurately reflect the equipment's current condition.
              </label>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !userConfirmed}
                className="px-5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
              >
                {submitting && <LoadingSpinner size="sm" />}
                Sign & Confirm {isCheckIn ? 'Check-In' : 'Return Handover'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
