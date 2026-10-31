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
  Wrench,
  Search,
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-brand-400" />
            Condition Reports & Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Physical audit history, optical alignment records, and wear-and-tear grading logs.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-brand-500/20 text-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Log Condition Inspection
        </button>
      </div>

      {/* Reports Listing */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Retrieving laboratory inspection logs..." size="md" />
        </div>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No condition reports on file</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Maintain high academic standards by performing routine inspections on your lab instruments.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-brand-300 text-xs font-semibold hover:bg-slate-700"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Log First Inspection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r) => {
            const isDamaged = r.conditionRating === 'damaged';
            const isFair = r.conditionRating === 'fair';

            return (
              <motion.div
                key={r._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700/80 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      {r.reportType}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isDamaged
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isFair
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {r.conditionRating}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-brand-400 shrink-0" />
                      <span className="truncate">{r.resource?.name || 'Academic Facility'}</span>
                    </h3>

                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      {r.notes || 'Inspection completed without issues noted.'}
                    </p>

                    {r.issuesIdentified && r.issuesIdentified.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged Anomalies:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {r.issuesIdentified.map((issue: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Inspector: {r.reportedBy?.name || 'Laboratory Staff'}
                  </span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Physical Condition Report</h3>
                  <p className="text-xs text-slate-400">Record equipment diagnostics and compliance checks</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Resource</label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Inspection Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="routine-maintenance">Routine Maintenance</option>
                    <option value="pre-use">Pre-Use Handover</option>
                    <option value="post-use">Post-Use Return</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condition Rating</label>
                  <select
                    value={conditionRating}
                    onChange={(e) => setConditionRating(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair (Wear Detected)</option>
                    <option value="damaged">Damaged / Needs Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Issues Identified (Comma-separated)
                </label>
                <input
                  type="text"
                  value={issuesIdentified}
                  onChange={(e) => setIssuesIdentified(e.target.value)}
                  placeholder="e.g. Scratched lens cover, loose bolt on mount, minor calibration drift"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Inspection Findings & Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detail any observations, cleaning performed, or calibration test results..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  Submit Inspection Log
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
