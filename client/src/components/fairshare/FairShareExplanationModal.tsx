import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Award,
  Layers,
  History,
  Info,
  X,
  UserCheck,
} from 'lucide-react';
import { FairShareExplanation } from '../../api/fairshare.api';

interface FairShareExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: FairShareExplanation | null;
  resourceName?: string;
  isOverridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
}

export const FairShareExplanationModal: React.FC<FairShareExplanationModalProps> = ({
  isOpen,
  onClose,
  explanation,
  resourceName,
  isOverridden,
  overriddenBy,
  overrideReason,
}) => {
  if (!isOpen || !explanation) return null;

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: 'Directly Approved',
        };
      case 'PENDING_REVIEW':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <UserCheck className="w-4 h-4 text-blue-600" />,
          label: 'Pending Human Custodian Review',
        };
      case 'WAITLISTED':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          label: 'Placed on Priority Waitlist',
        };
      case 'REJECTED':
      default:
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          label: 'Allocation Declined',
        };
    }
  };

  const badge = getDecisionBadge(explanation.finalDecision);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">FairShare Transparency Breakdown</h3>
              <p className="text-xs text-indigo-200">
                {resourceName ? `Allocation diagnostics for "${resourceName}"` : 'Explainable non-arbitrary allocation decision'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Final Decision Banner */}
          <div className={`p-4 rounded-xl border ${badge.bg} flex items-start justify-between`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {badge.icon}
                <span className="font-semibold text-sm uppercase tracking-wider">{badge.label}</span>
              </div>
              <p className="text-sm font-medium text-slate-800">{explanation.reason}</p>
            </div>
          </div>

          {/* Manager Override Indicator */}
          {isOverridden && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80">
              <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs uppercase tracking-wider mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Managerial Policy Override Applied</span>
              </div>
              <p className="text-sm text-slate-700">
                Authorized by: <strong className="font-semibold">{overriddenBy || 'Facility Manager'}</strong>
              </p>
              {overrideReason && (
                <p className="text-xs text-slate-600 mt-1 italic">"{overrideReason}"</p>
              )}
            </div>
          )}

          {/* Core Decision Factors Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Multi-Factor Institutional Fairness Verification</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1. Eligibility */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">1. Eligibility Result</span>
                  {explanation.eligibilityResult.passed ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Passed
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3 mr-1" /> Deficient
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{explanation.eligibilityResult.details}</p>
              </div>

              {/* 2. Availability */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">2. Asset Availability</span>
                  {explanation.availabilityResult.passed ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Operational
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Offline
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{explanation.availabilityResult.details}</p>
              </div>

              {/* 3. Booking Conflict */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">3. Timeslot Overlap</span>
                  {!explanation.conflictResult.hasConflict ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Clear
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3 mr-1" /> Collision
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{explanation.conflictResult.details}</p>
              </div>

              {/* 4. Active Booking Limit */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">4. Active Quota</span>
                  {explanation.activeLimitResult.passed ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Within Limit
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3 mr-1" /> Quota Reached
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{explanation.activeLimitResult.details}</p>
              </div>

              {/* 5. Previous Usage / Monopolisation */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">5. Monopolisation & Past Usage</span>
                  {explanation.previousUsageResult.passed ? (
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Balanced
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      <History className="w-3 h-3 mr-1" /> Cooldown Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{explanation.previousUsageResult.details}</p>
              </div>
            </div>
          </div>

          {/* 6. Applicable Priority Rule & Factors */}
          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                  Applicable Institutional Priority Rule
                </span>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-200">
                Score: {explanation.priorityRule.score} pts
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800">{explanation.priorityRule.appliedRule}</p>
              <p className="text-xs text-slate-600">{explanation.priorityRule.details}</p>
            </div>

            {explanation.priorityRule.factors && explanation.priorityRule.factors.length > 0 && (
              <div className="pt-2 border-t border-indigo-100 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Fairness Credit Factors:</span>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  {explanation.priorityRule.factors.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Ethics & Transparency Guarantee Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>FairShare Governance Guarantee:</strong> Allocation determinations are strictly deterministic
              and rule-based according to institutional charter. No black-box AI scoring is permitted to arbitrarily
              penalize borrowers or approve restricted hazardous equipment.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
