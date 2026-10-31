import React from 'react';
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { ConflictDetectionResponse } from '../../api/ai.api';

interface SchedulingConflictAlertProps {
  conflictData: ConflictDetectionResponse | null;
  loading: boolean;
  onSelectAlternativeSlot?: (slot: { date: string; timeSlot: string; startTime: string; endTime: string }) => void;
  onProceedToWaitlist?: () => void;
}

export const SchedulingConflictAlert: React.FC<SchedulingConflictAlertProps> = ({
  conflictData,
  loading,
  onSelectAlternativeSlot,
}) => {
  if (loading) {
    return (
      <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-[#1769D2]/30 border-t-[#1769D2] rounded-full animate-spin shrink-0" />
        <span className="text-xs text-[#64748B]">
          AI Conflict Scanner checking facility calendars, overlapping bookings & operating schedules...
        </span>
      </div>
    );
  }

  if (!conflictData) return null;

  if (!conflictData.hasConflict) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#16834A]">
          <CheckCircle2 className="w-4 h-4 text-[#16834A] shrink-0" />
          <span className="font-medium">
            AI Conflict Check: Slot is fully vacant, conflict-free, and within facility operating hours.
          </span>
        </div>
        <span className="text-[10px] text-[#64748B] font-mono hidden sm:inline">
          {conflictData.aiProvider}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
      {/* Warning Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-[#DC2626]">Scheduling Conflict Detected</h4>
            <p className="text-xs text-[#172033] mt-0.5 leading-relaxed">
              {conflictData.overallExplanation}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-100 text-[#DC2626] shrink-0 font-medium">
          Conflict Diagnostic
        </span>
      </div>

      {/* Conflicts Detailed Breakdown */}
      <div className="space-y-1.5 pl-6">
        {conflictData.conflicts.map((c, idx) => (
          <div key={idx} className="text-xs text-[#172033] flex items-start gap-1.5">
            <span className="font-semibold text-[#DC2626]">• {c.title}:</span>
            <span className="text-[#64748B]">{c.explanation}</span>
          </div>
        ))}
      </div>

      {/* Suggested Alternative Conflict-Free Slots */}
      {conflictData.suggestedAlternativeSlots && conflictData.suggestedAlternativeSlots.length > 0 && (
        <div className="mt-2 pt-3 border-t border-red-200 pl-6 space-y-2">
          <div className="text-[11px] font-semibold text-[#1769D2] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#1769D2]" />
            AI-Suggested Conflict-Free Alternative Slots:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {conflictData.suggestedAlternativeSlots.map((slot, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => onSelectAlternativeSlot && onSelectAlternativeSlot(slot)}
                className="p-2.5 rounded-lg bg-white hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#1769D2] text-left transition-all group"
              >
                <div className="text-[11px] font-semibold text-[#172033] group-hover:text-[#1769D2] flex items-center justify-between">
                  <span>{slot.date}</span>
                  <Calendar className="w-3 h-3 text-[#64748B] group-hover:text-[#1769D2]" />
                </div>
                <div className="text-[10px] text-[#64748B] mt-0.5 font-mono">
                  {slot.timeSlot}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
