import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  X,
  History,
  Scale,
  Lock,
} from 'lucide-react';
import { summarizeIncidentApi, IncidentSummaryResponse } from '../../api/ai.api';

interface IncidentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentData: {
    incidentId?: string;
    description: string;
    category: string;
    resourceName: string;
    reportedBy: string;
    severity: string;
    evidence?: string[];
  } | null;
}

export const IncidentSummaryModal: React.FC<IncidentSummaryModalProps> = ({
  isOpen,
  onClose,
  incidentData,
}) => {
  const [summary, setSummary] = useState<IncidentSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && incidentData) {
      setLoading(true);
      setError('');
      summarizeIncidentApi(incidentData)
        .then((res) => {
          if (res.success) {
            setSummary(res.data);
          }
        })
        .catch((err) => {
          console.error('Error generating incident summary:', err);
          setError('Failed to generate incident summary.');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, incidentData]);

  if (!isOpen || !incidentData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI Incident Review Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Advisory Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {incidentData.resourceName} • {incidentData.category.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* CRITICAL ETHICAL & SAFETY MANDATE ALERT */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Scale className="w-4 h-4 shrink-0" />
              <span>SAFETY GOVERNANCE POLICY: AI NEVER IMPOSES PENALTIES</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              AI must never independently impose penalties, approve restricted access, or decide safety disputes.
              This review synthesis is strictly an advisory aid for institutional managers. All disciplinary sanctions
              and dispute outcomes require verified human custodian authorization.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">
                Synthesizing incident narrative, evaluating equipment impact & cross-referencing audit histories...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-rose-400 text-xs">{error}</div>
          ) : summary ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-brand-300 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Executive Synthesis
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{summary.executiveSummary}</p>
              </div>

              {/* Key Findings */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Incident Findings</h4>
                <div className="space-y-1.5">
                  {summary.keyFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hardware Impact</span>
                  <p className="text-xs font-semibold text-white mt-1">
                    {summary.riskAssessment.hardwareImpact}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Hazard Rating</span>
                  <p className="text-xs font-semibold text-amber-400 mt-1">
                    {summary.riskAssessment.safetyHazardRating}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Operational Downtime</span>
                  <p className="text-xs font-semibold text-rose-300 mt-1">
                    {summary.riskAssessment.operationalDisruption}
                  </p>
                </div>
              </div>

              {/* Historical Correlation */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  Historical Correlation & Reliability Track Record
                </div>
                <p className="text-xs text-slate-300">{summary.historicalCorrelation.correlationNote}</p>
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Prior reports by user: {summary.historicalCorrelation.repeatIncidentsByReporter}</span>
                  <span>Prior reports on asset: {summary.historicalCorrelation.assetPastIncidentsCount}</span>
                </div>
              </div>

              {/* Suggested Manager Actions (Checklist) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommended Manager Review Steps
                </h4>
                <div className="space-y-1.5">
                  {summary.suggestedManagerActionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer with AI Engine Disclosure */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Engine: {summary?.aiProvider || 'RENTORA Embedded Intelligence Engine'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Synthesis
          </button>
        </div>
      </motion.div>
    </div>
  );
};
