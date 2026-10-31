import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getConditionReportsApi, createConditionReportApi, getOwnerResourcesApi } from '../../api/owner.api';
import { Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ClipboardCheck,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Calendar,
  FileText,
  User,
  X,
} from 'lucide-react';

export const ConditionReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New report form state
  const [resourceId, setResourceId] = useState('');
  const [reportType, setReportType] = useState<'pre-use' | 'post-use' | 'routine-maintenance'>('routine-maintenance');
  const [conditionRating, setConditionRating] = useState<'excellent' | 'good' | 'fair' | 'damaged'>('good');
  const [notes, setNotes] = useState('');
  const [issuesIdentified, setIssuesIdentified] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, resourcesRes] = await Promise.all([
        getConditionReportsApi(),
        getOwnerResourcesApi(),
      ]);
      if (reportsRes.success) setReports(reportsRes.data);
      if (resourcesRes.success) {
        setResources(resourcesRes.data);
        if (resourcesRes.data.length > 0) setResourceId(resourcesRes.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching condition reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId) return;

    setSubmitting(true);
    try {
      const res = await createConditionReportApi({
        resourceId,
        reportType,
        conditionRating,
        notes,
        issuesIdentified: issuesIdentified ? issuesIdentified.split(',').map((s) => s.trim()) : [],
      });

      if (res.success) {
        setModalOpen(false);
        setNotes('');
        setIssuesIdentified('');
        await loadData();
      }
    } catch (err) {
      console.error('Error submitting report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-[#1769D2]" />
            Condition Reports & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Physical audit history, optical alignment records, and wear-and-tear grading logs.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Log Condition Inspection
        </button>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Loading condition registry..." size="md" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white">
          <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#172033]">No condition inspection records</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            Log routine calibrations, pre-use verifications, and post-usage wear logs to maintain audit readiness.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#E2E8F0] bg-white p-5 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                    {r.reportType}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      r.conditionRating === 'excellent'
                        ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                        : r.conditionRating === 'damaged'
                        ? 'bg-red-50 text-[#DC2626] border border-red-200'
                        : 'bg-amber-50 text-[#D97706] border border-amber-200'
                    }`}
                  >
                    {r.conditionRating}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#1769D2] shrink-0" />
                    <span className="truncate">{r.resource?.name || r.resourceName || 'Resource Asset'}</span>
                  </h3>

                  <p className="text-xs text-[#172033] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] leading-relaxed">
                    {r.notes || 'Routine condition inspection recorded.'}
                  </p>

                  {r.issuesIdentified && r.issuesIdentified.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] space-y-1">
                      <span className="font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Issues Flagged:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {r.issuesIdentified.map((issue: string, idx: number) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-[#64748B]" />
                  {r.inspector?.name || 'Lab In-Charge'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#64748B]" />
                  {new Date(r.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Log Condition Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Log Condition Inspection</h3>
                  <p className="text-xs text-[#64748B]">Equipment calibration & wear assessment</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Target Resource</label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                >
                  {resources.map((res) => (
                    <option key={res._id} value={res._id}>
                      {res.name} ({res.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Inspection Stage</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                  >
                    <option value="routine-maintenance">Routine Maintenance</option>
                    <option value="pre-use">Pre-use Handover</option>
                    <option value="post-use">Post-use Return</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Condition Rating</label>
                  <select
                    value={conditionRating}
                    onChange={(e) => setConditionRating(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                  >
                    <option value="excellent">Excellent / Calibrated</option>
                    <option value="good">Good / Functional</option>
                    <option value="fair">Fair / Minor Wear</option>
                    <option value="damaged">Damaged / Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#1769D2]" /> Condition Notes & Assessment
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Note physical integrity, cleanliness, alignment, power cycle tests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Issues Identified (Comma-separated, optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scratched lens cover, Missing hex key #4"
                  value={issuesIdentified}
                  onChange={(e) => setIssuesIdentified(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !notes.trim()}
                  className="px-5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  Submit Inspection Report
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ConditionReportsPage;
