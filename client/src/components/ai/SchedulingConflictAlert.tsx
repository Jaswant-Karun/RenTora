import React from 'react';
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
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
  onProceedToWaitlist,
}) => {
  if (loading) {
    return (
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin shrink-0" />
        <span className="text-xs text-slate-400">
          AI Conflict Scanner inspecting maintenance calendars, concurrent requests & operating schedules...
        </span>
      </div>
    );
  }

  if (!conflictData) return null;

  if (!conflictData.hasConflict) {
    return (
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">
            AI Conflict Check: Slot is fully vacant, conflict-free, and within facility operating schedule.
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
          {conflictData.aiProvider}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
      {/* Warning Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-rose-300">Scheduling Conflict Detected</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {conflictData.overallExplanation}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 shrink-0">
          AI Diagnostic
        </span>
      </div>

      {/* Conflicts Detailed Breakdown */}
      <div className="space-y-1.5 pl-7">
        {conflictData.conflicts.map((c, idx) => (
          <div key={idx} className="text-xs text-rose-200/90 flex items-start gap-1.5">
            <span className="font-bold">• {c.title}:</span>
            <span className="text-slate-300">{c.explanation}</span>
          </div>
        ))}
      </div>

      {/* Suggested Alternative Conflict-Free Slots */}
      {conflictData.suggestedAlternativeSlots && conflictData.suggestedAlternativeSlots.length > 0 && (
        <div className="mt-2 pt-3 border-t border-rose-500/20 pl-7 space-y-2">
          <div className="text-[11px] font-bold text-brand-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            AI-Suggested Conflict-Free Alternative Slots:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {conflictData.suggestedAlternativeSlots.map((slot, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => onSelectAlternativeSlot && onSelectAlternativeSlot(slot)}
                className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-brand-600/20 border border-slate-700/80 hover:border-brand-500 text-left transition-all group"
              >
                <div className="text-[11px] font-semibold text-white group-hover:text-brand-300 flex items-center justify-between">
                  <span>{slot.date}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{slot.confidenceScore}% Open</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {slot.timeSlot}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Option to Proceed to Waitlist */}
      {conflictData.canProceedToWaitlist && onProceedToWaitlist && (
        <div className="pl-7 pt-1 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            High demand period. You can enter the priority waiting list queue.
          </p>
          <button
            type="button"
            onClick={onProceedToWaitlist}
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 underline underline-offset-2"
          >
            Continue to Waiting List
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
