import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Resource } from '../../types/resource';
import { createBookingApi } from '../../api/resource.api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import {
  X,
  Calendar,
  Clock,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldAlert,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  resource,
  onClose,
  onSuccess,
}) => {
  const [date, setDate] = useState('2026-11-03');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [purpose, setPurpose] = useState('');
  const [supervisorName, setSupervisorName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !resource) return null;

  const standardTimeSlots = [
    '09:00 AM - 11:00 AM (Morning Slot 1)',
    '11:00 AM - 01:00 PM (Morning Slot 2)',
    '02:00 PM - 04:00 PM (Afternoon Slot 1)',
    '04:00 PM - 06:00 PM (Evening Slot 2)',
    '06:00 PM - 08:00 PM (Extended Research Slot)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setError('Please provide a specific academic or research purpose for this reservation.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await createBookingApi({
        resourceId: resource._id,
        date,
        timeSlot,
        purpose,
        supervisorName: supervisorName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(res.message || 'Booking request submitted successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit booking reservation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div>
              <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                Institutional Reservation Gateway
              </span>
              <h3 className="text-base font-extrabold text-white truncate max-w-sm">
                Reserve: {resource.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 overflow-y-auto space-y-4">
            {/* Resource summary header card */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
              <img
                src={resource.images?.[0]}
                alt={resource.name}
                className="w-14 h-14 rounded-lg object-cover border border-slate-800"
              />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-white truncate">{resource.name}</p>
                <p className="text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <Building className="w-3 h-3 text-slate-500" />
                  {resource.location} • {resource.institution}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-[10px] font-semibold ${resource.approvalRequired ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {resource.approvalRequired ? 'Requires Endorsement' : 'Instant Confirmation'}
                  </span>
                </div>
              </div>
            </div>

            {successMessage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 text-emerald-300"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-sm text-white">Reservation Confirmed!</h4>
                <p className="text-xs">{successMessage}</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Date Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Reservation Date <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>

                {/* Timeslot Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Timeslot Interval <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      required
                      className="w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-700/80 pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    >
                      {standardTimeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Purpose of use */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Purpose of Reservation & Project Title <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe experiments, coursework module, or project goals..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                    className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 p-3 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                  />
                </div>

                {/* Supervisor / Faculty Sponsor */}
                <Input
                  label="Faculty Advisor / Lab In-Charge"
                  placeholder="e.g. Dr. Meera Raman / Prof. Suresh Nair"
                  leftIcon={<UserCheck className="w-4 h-4" />}
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                />

                {/* Compliance Agreement Note */}
                <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    By submitting, you agree to comply with equipment safety instructions, post-session cleaning protocols, and return conditions.
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                    Confirm Reservation Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingModal;
