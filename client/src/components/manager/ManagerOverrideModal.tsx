import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ManagerOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: () => void;
}

export const ManagerOverrideModal: React.FC<ManagerOverrideModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [mandatoryReason, setMandatoryReason] = useState('');
  const [action, setAction] = useState<'approve' | 'promote_waitlist' | 'bypass_limits'>('approve');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mandatoryReason || mandatoryReason.trim().length < 10) {
      setErrorMessage('A mandatory detailed justification (minimum 10 characters) is legally required for audit logging.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = localStorage.getItem('rentora_token');
      const res = await fetch(`http://localhost:5000/api/bookings/${booking._id}/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mandatoryReason: mandatoryReason.trim(),
          action,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Manager override executed and committed to immutable audit ledger.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Error executing manager override.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error applying override.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manager Override Protocol</h3>
              <p className="text-xs text-slate-400">Institutional Governance & Sanction Bypass</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
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
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Asset:</span>
                <span className="text-white font-medium">{booking.resourceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Borrower:</span>
                <span className="text-white font-medium">{booking.userName || booking.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="text-amber-400 font-bold uppercase">{booking.status}</span>
              </div>
              {booking.waitlistReason && (
                <div className="pt-1 text-[11px] text-slate-400">
                  <strong>Waitlist Rationale:</strong> {booking.waitlistReason}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Override Directive Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="approve">Immediate Confirmation & Approval (Bypass Queue)</option>
                <option value="promote_waitlist">Promote to #1 in Standby Queue</option>
                <option value="bypass_limits">Bypass Active Student Hour Limit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Mandatory Justification Reason (Required, min 10 chars)
                </span>
                <span className="text-[10px] text-slate-400">Committed to immutable audit ledger</span>
              </label>
              <textarea
                rows={3}
                required
                value={mandatoryReason}
                onChange={(e) => setMandatoryReason(e.target.value)}
                placeholder="Cite formal administrative justification: e.g. Sponsored grant deadline, Dean's special research clearance, or competition finalist priority..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <span className="text-[10px] text-slate-500 block pt-0.5">
                {mandatoryReason.length}/10 minimum characters required
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed">
              ⚠️ <strong>Audit Warning:</strong> All manager overrides are recorded in the institutional ledger with your
              credentials, timestamp, and mandatory justification. This record is permanent and non-repudiable.
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || mandatoryReason.trim().length < 10}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                {loading && <LoadingSpinner size="sm" />}
                Authorize Override
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
