import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import apiClient from '../../api/client';

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
      const res = await apiClient.post(`/bookings/${booking._id}/override`, {
        mandatoryReason: mandatoryReason.trim(),
        action,
      });

      if (res.data.success) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] border border-amber-200 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#172033]">Manager Override Protocol</h3>
              <p className="text-xs text-[#64748B]">Institutional Governance & Policy Bypass</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
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
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Target Asset:</span>
                <span className="text-[#172033] font-medium">{booking.resourceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Borrower:</span>
                <span className="text-[#172033] font-medium">{booking.userName || booking.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Current Status:</span>
                <span className="text-[#D97706] font-semibold uppercase">{booking.status}</span>
              </div>
              {booking.waitlistReason && (
                <div className="pt-1 text-[11px] text-[#64748B]">
                  <strong>Waitlist Rationale:</strong> {booking.waitlistReason}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Override Directive Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
              >
                <option value="approve">Immediate Confirmation & Approval (Bypass Queue)</option>
                <option value="promote_waitlist">Promote to #1 in Standby Queue</option>
                <option value="bypass_limits">Bypass Active Student Hour Limit</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#D97706]" />
                  Mandatory Justification Reason (min 10 chars)
                </span>
                <span className="text-[10px] text-[#64748B]">Audit logged</span>
              </label>
              <textarea
                rows={3}
                required
                value={mandatoryReason}
                onChange={(e) => setMandatoryReason(e.target.value)}
                placeholder="Cite formal administrative justification: e.g. Sponsored grant deadline, Dean's special research clearance..."
                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
              />
              <span className="text-[10px] text-[#64748B] block pt-0.5">
                {mandatoryReason.length}/10 minimum characters required
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-[#172033] leading-relaxed">
              ⚠️ <strong>Audit Warning:</strong> All manager overrides are recorded in the institutional ledger with your
              credentials, timestamp, and mandatory justification. This record is permanent.
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || mandatoryReason.trim().length < 10}
                className="px-5 py-2 rounded-lg bg-[#D97706] hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
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
