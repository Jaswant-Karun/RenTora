import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Booking, AuditEntry } from '../../types/resource';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  UserCheck,
  LogOut,
  QrCode,
  ShieldCheck,
  History,
  Calendar,
  ChevronRight,
  Info,
} from 'lucide-react';

interface BookingTimelineProps {
  booking: Booking;
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({ booking }) => {
  const [showAuditModal, setShowAuditModal] = useState(false);

  const status = booking.status;
  const isRejected = status === 'rejected';
  const isCancelled = status === 'cancelled';
  const isWaitlisted = status === 'waitlisted';
  const isOverdue = status === 'overdue' || booking.isOverdue;

  // Stages in the standard lifecycle
  const stages = [
    {
      id: 'step_requested',
      label: 'Submitted',
      sublabel: 'Awaiting Review',
      completed: true,
      active: status === 'pending',
      date: booking.createdAt,
    },
    {
      id: 'step_reviewed',
      label: 'Review & Approval',
      sublabel: booking.status === 'under_review' ? 'Under Review' : 'Endorsed',
      completed: ['approved', 'checked_in', 'return_pending', 'completed', 'active'].includes(status),
      active: status === 'under_review' || status === 'approved',
      date: booking.status === 'approved' ? booking.updatedAt : undefined,
    },
    {
      id: 'step_checkin',
      label: 'Checked In',
      sublabel: booking.checkedInAt
        ? new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Initial Condition',
      completed: ['checked_in', 'return_pending', 'completed'].includes(status) || !!booking.checkedIn,
      active: status === 'checked_in',
      date: booking.checkedInAt,
    },
    {
      id: 'step_return',
      label: 'Return Initiated',
      sublabel: booking.returnInitiatedAt
        ? new Date(booking.returnInitiatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Return Condition',
      completed: ['return_pending', 'completed'].includes(status) || !!booking.returnInitiated,
      active: status === 'return_pending',
      date: booking.returnInitiatedAt,
    },
    {
      id: 'step_completed',
      label: 'Completed',
      sublabel: 'Return Inspected',
      completed: status === 'completed' || !!booking.checkedOut,
      active: status === 'completed',
      date: booking.checkedOutAt,
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      {/* Overdue Alert Banner */}
      {isOverdue && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>SESSION OVERDUE:</strong> Scheduled window ended without recorded check-out. Please return
              equipment immediately to avoid penalty points.
            </span>
          </div>
        </div>
      )}

      {/* Exception Status Banner (Rejected / Cancelled / Waitlisted) */}
      {isRejected && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-400">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Reservation Request Rejected</span>
          </div>
          <p className="text-rose-200 pl-6">
            <strong>Stated Custodian Reason:</strong> {booking.rejectionReason || 'Scheduling or training conflict'}
          </p>
        </div>
      )}

      {isCancelled && (
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Reservation Cancelled</span>
          </div>
          <p className="text-slate-400 pl-6">
            <strong>Reason:</strong> {booking.cancellationReason || 'Cancelled by user or facility manager.'}
          </p>
        </div>
      )}

      {isWaitlisted && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Placed on Standby Priority Waitlist</span>
          </div>
          <p className="text-amber-200/90 pl-6">
            <strong>Queue Notice:</strong>{' '}
            {booking.waitlistReason || 'High demand timeslot. You will be auto-notified if an opening arises.'}
          </p>
        </div>
      )}

      {/* Main 5-Stage Stepper Track */}
      {!isRejected && !isCancelled && !isWaitlisted && (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-800 -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500 -z-0 transition-all duration-500"
              style={{
                width:
                  status === 'completed'
                    ? 'calc(100% - 3rem)'
                    : status === 'return_pending'
                    ? '75%'
                    : status === 'checked_in'
                    ? '50%'
                    : status === 'approved'
                    ? '25%'
                    : '5%',
              }}
            />

            {stages.map((stage, idx) => {
              const isPassed = stage.completed;
              const isCurrent = stage.active;

              return (
                <div key={stage.id} className="relative z-10 flex flex-col items-center text-center px-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                      isPassed
                        ? 'bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-brand-500/20'
                        : isCurrent
                        ? 'bg-slate-900 border-2 border-brand-400 text-brand-300 ring-4 ring-brand-500/10 animate-pulse'
                        : 'bg-slate-900 border border-slate-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <p
                    className={`mt-2 text-[11px] font-bold ${
                      isPassed || isCurrent ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{stage.sublabel}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recorded Condition Details (If present) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {booking.initialCondition && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-brand-400 flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Initial Handover Condition:
            </span>
            <p className="text-slate-300 line-clamp-2">{booking.initialCondition.conditionNotes}</p>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>Status: {booking.initialCondition.operationalStatus}</span>
              <span>Meter: {booking.initialCondition.meterReading || '0 hrs'}</span>
            </div>
          </div>
        )}

        {booking.returnCondition && (
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-400 flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Return Inspection Condition:
            </span>
            <p className="text-slate-300 line-clamp-2">{booking.returnCondition.conditionNotes}</p>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>Cleanliness: {booking.returnCondition.cleanliness}</span>
              <span>Meter: {booking.returnCondition.meterReading || '4 hrs'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Audit History Trigger */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-slate-500">Ref: #{booking._id.slice(-6).toUpperCase()}</span>
        <button
          onClick={() => setShowAuditModal(true)}
          className="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          View Immutable Audit Trail ({booking.auditTrail?.length || 0})
        </button>
      </div>

      {/* Audit History Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cryptographic Audit History</h3>
                  <p className="text-xs text-slate-400">Booking #{booking._id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
              {(!booking.auditTrail || booking.auditTrail.length === 0) ? (
                <p className="text-xs text-slate-500 py-6 text-center">No transitions recorded yet.</p>
              ) : (
                booking.auditTrail.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-brand-400 font-bold uppercase tracking-wider text-[11px]">
                        {entry.transition}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span>{entry.fromStatus}</span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                      <span className="text-white font-semibold">{entry.toStatus}</span>
                      <span className="text-slate-500">•</span>
                      <span>By: <strong className="text-slate-300">{entry.performedBy}</strong> ({entry.performedByRole})</span>
                    </div>

                    {entry.note && (
                      <p className="text-slate-300 text-xs pt-1 border-t border-slate-900 mt-1">
                        {entry.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close Audit Trail
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
