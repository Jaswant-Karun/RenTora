import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  X,
  History,
  Scale,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-2xl rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#172033]">AI Incident Review Assistant</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                  Advisory Only
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {incidentData.resourceName} • {incidentData.category.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#FFFFFF]">
          {/* CRITICAL ETHICAL & SAFETY MANDATE ALERT */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 text-[#D97706] font-semibold text-xs">
              <Scale className="w-4 h-4 shrink-0" />
              <span>SAFETY GOVERNANCE POLICY: AI NEVER IMPOSES PENALTIES</span>
            </div>
            <p className="text-xs text-[#172033] leading-relaxed">
              AI must never independently impose penalties, approve restricted access, or decide safety disputes.
              This review synthesis is strictly an advisory aid for institutional managers. All disciplinary sanctions
              and dispute outcomes require verified human custodian authorization.
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#1769D2]/20 border-t-[#1769D2] rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#64748B]">
                Synthesizing incident narrative, evaluating equipment impact & cross-referencing audit histories...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-[#DC2626] text-xs">{error}</div>
          ) : summary ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#1769D2] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Executive Synthesis
                </div>
                <p className="text-xs text-[#172033] leading-relaxed">{summary.executiveSummary}</p>
              </div>

              {/* Key Findings */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Key Incident Findings</h4>
                <div className="space-y-1.5">
                  {summary.keyFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#172033]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#16834A] mt-0.5 shrink-0" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Hardware Impact</span>
                  <p className="text-xs font-semibold text-[#172033] mt-1">
                    {summary.riskAssessment.hardwareImpact}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Hazard Rating</span>
                  <p className="text-xs font-semibold text-[#D97706] mt-1">
                    {summary.riskAssessment.safetyHazardRating}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Operational Downtime</span>
                  <p className="text-xs font-semibold text-[#DC2626] mt-1">
                    {summary.riskAssessment.operationalDisruption}
                  </p>
                </div>
              </div>

              {/* Historical Correlation */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  <History className="w-3.5 h-3.5 text-[#1769D2]" />
                  Historical Correlation & Reliability Track Record
                </div>
                <p className="text-xs text-[#172033]">{summary.historicalCorrelation.correlationNote}</p>
                <div className="flex items-center gap-4 text-[11px] text-[#64748B] pt-1">
                  <span>Prior reports by user: {summary.historicalCorrelation.repeatIncidentsByReporter}</span>
                  <span>Prior reports on asset: {summary.historicalCorrelation.assetPastIncidentsCount}</span>
                </div>
              </div>

              {/* Suggested Manager Actions (Checklist) */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Recommended Manager Review Steps
                </h4>
                <div className="space-y-1.5">
                  {summary.suggestedManagerActionItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#172033] flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-[#64748B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
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
        <div className="p-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
          <span className="font-mono text-[11px]">
            Engine: {summary?.aiProvider || 'RENTORA Institutional Intelligence'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#172033] rounded-lg text-xs font-medium transition-colors"
          >
            Close Synthesis
          </button>
        </div>
      </motion.div>
    </div>
  );
};
