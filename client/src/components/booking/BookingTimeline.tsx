import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Booking } from '../../types/resource';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LogOut,
  QrCode,
  History,
  ChevronRight,
  X,
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
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>
              <strong>SESSION OVERDUE:</strong> Scheduled window ended without recorded check-out. Please return
              equipment immediately to avoid penalty points.
            </span>
          </div>
        </div>
      )}

      {/* Exception Status Banner (Rejected / Cancelled / Waitlisted) */}
      {isRejected && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-[#DC2626]">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Booking Request Declined</span>
          </div>
          <p className="text-[#172033] pl-6">
            <strong>Reason:</strong> {booking.rejectionReason || 'Conflicting schedule or safety pre-requisites not met.'}
          </p>
        </div>
      )}

      {isCancelled && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-[#64748B]">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Booking Cancelled</span>
          </div>
          <p className="text-[#64748B] pl-6">
            <strong>Reason:</strong> {booking.cancellationReason || 'Cancelled by requester.'}
          </p>
        </div>
      )}

      {isWaitlisted && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-[#D97706]">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Placed on Standby Priority Waitlist</span>
          </div>
          <p className="text-[#172033] pl-6">
            <strong>Queue Notice:</strong>{' '}
            {booking.waitlistReason || 'High demand timeslot. You will be auto-notified if an opening arises.'}
          </p>
        </div>
      )}

      {/* Main 5-Stage Stepper Track */}
      {!isRejected && !isCancelled && !isWaitlisted && (
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E2E8F0] -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-[#1769D2] -z-0 transition-all duration-500"
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                      isPassed
                        ? 'bg-[#1769D2] text-white'
                        : isCurrent
                        ? 'bg-white border-2 border-[#1769D2] text-[#1769D2] ring-4 ring-[#1769D2]/10'
                        : 'bg-white border border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <p
                    className={`mt-2 text-[11px] font-semibold ${
                      isPassed || isCurrent ? 'text-[#172033]' : 'text-[#64748B]'
                    }`}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[10px] text-[#64748B]">{stage.sublabel}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recorded Condition Details (If present) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {booking.initialCondition && (
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#1769D2] flex items-center gap-1">
              <QrCode className="w-3 h-3" /> Initial Handover Condition:
            </span>
            <p className="text-[#172033] line-clamp-2">{booking.initialCondition.conditionNotes}</p>
            <div className="flex justify-between text-[10px] text-[#64748B] pt-1">
              <span>Status: {booking.initialCondition.operationalStatus}</span>
              <span>Meter: {booking.initialCondition.meterReading || '0 hrs'}</span>
            </div>
          </div>
        )}

        {booking.returnCondition && (
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#16834A] flex items-center gap-1">
              <LogOut className="w-3 h-3" /> Return Inspection Condition:
            </span>
            <p className="text-[#172033] line-clamp-2">{booking.returnCondition.conditionNotes}</p>
            <div className="flex justify-between text-[10px] text-[#64748B] pt-1">
              <span>Cleanliness: {booking.returnCondition.cleanliness}</span>
              <span>Meter: {booking.returnCondition.meterReading || '4 hrs'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Audit History Trigger */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-[#64748B] font-mono">Ref: #{booking._id.slice(-6).toUpperCase()}</span>
        <button
          onClick={() => setShowAuditModal(true)}
          className="inline-flex items-center gap-1.5 text-[#1769D2] hover:text-[#1256B0] font-medium transition-colors"
        >
          <History className="w-3.5 h-3.5" />
          View Immutable Audit Trail ({booking.auditTrail?.length || 0})
        </button>
      </div>

      {/* Audit History Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#172033]">Audit History Ledger</h3>
                  <p className="text-xs text-[#64748B]">Booking #{booking._id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="text-[#64748B] hover:text-[#172033] text-sm p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(!booking.auditTrail || booking.auditTrail.length === 0) ? (
                <p className="text-xs text-[#64748B] py-6 text-center">No transitions recorded yet.</p>
              ) : (
                booking.auditTrail.map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[#1769D2] font-semibold uppercase tracking-wider text-[11px]">
                        {entry.transition}
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[#64748B] text-[11px]">
                      <span>{entry.fromStatus}</span>
                      <ChevronRight className="w-3 h-3 text-[#64748B]" />
                      <span className="text-[#172033] font-semibold">{entry.toStatus}</span>
                      <span>•</span>
                      <span>By: <strong className="text-[#172033]">{entry.performedBy}</strong> ({entry.performedByRole})</span>
                    </div>

                    {entry.note && (
                      <p className="text-[#172033] text-xs pt-1 border-t border-[#E2E8F0] mt-1">
                        {entry.note}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-medium hover:bg-slate-50"
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
