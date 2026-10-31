import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerIncidentsApi, createIncidentApi, getOwnerResourcesApi } from '../../api/owner.api';
import { Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  AlertTriangle,
  PlusCircle,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Calendar,
  Clock,
  User,
  Activity,
  Zap,
} from 'lucide-react';

export const OwnerIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [resourceId, setResourceId] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, resRes] = await Promise.all([
        getOwnerIncidentsApi(),
        getOwnerResourcesApi(),
      ]);
      if (incRes.success) setIncidents(incRes.data);
      if (resRes.success) {
        setResources(resRes.data);
        if (resRes.data.length > 0) setResourceId(resRes.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceId || !title || !description) return;

    setSubmitting(true);
    try {
      const res = await createIncidentApi({
        resourceId,
        severity,
        title,
        description,
        actionTaken,
      });

      if (res.success) {
        setModalOpen(false);
        setTitle('');
        setDescription('');
        setActionTaken('');
        await loadData();
      }
    } catch (err) {
      console.error('Error creating incident:', err);
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
            <AlertTriangle className="w-8 h-8 text-rose-400" />
            Safety Incidents & Breaches
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            OSHA/EH&S incident logging, emergency shutdowns, and hazard mitigating corrective actions.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium shadow-lg shadow-rose-500/20 text-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Log Safety Incident
        </button>
      </div>

      {/* Incidents Listing */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Scanning environmental health & safety records..." size="md" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <ShieldAlert className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">Clean Safety Record</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Zero active safety violations or equipment hazards logged for your laboratories.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report Incident
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {incidents.map((inc) => {
            const isCritical = inc.severity === 'critical';
            const isHigh = inc.severity === 'high';

            return (
              <motion.div
                key={inc._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700/80 transition-all shadow-lg"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : isHigh
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}
                    >
                      {inc.severity} Severity
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {inc.status || 'Reported'}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(inc.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {inc.title}
                  </h3>

                  <p className="text-xs text-slate-300 max-w-3xl">{inc.description}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-brand-400" />
                      Resource: <strong className="text-white">{inc.resource?.name || 'Lab Equipment'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      Reported By: {inc.reportedBy?.name || 'Safety Officer'}
                    </span>
                  </div>

                  {inc.actionTaken && (
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-emerald-300">
                      <strong>Immediate Action Taken:</strong> {inc.actionTaken}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Incident Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Log Safety Incident</h3>
                  <p className="text-xs text-slate-400">Record laboratory malfunction or safety protocol breach</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Resource</label>
                <select
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="low">Low (Cosmetic/Minor)</option>
                    <option value="medium">Medium (Requires Inspection)</option>
                    <option value="high">High (Equipment Interrupted)</option>
                    <option value="critical">Critical (Emergency Stop / Safety Hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Headline</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Overheat Alarm Triggered"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Description & Sequence</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explain exactly what happened, borrower actions, observed alarms..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Immediate Containment Action</label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="e.g. Powered down unit, isolated ventilation, notified supervisor"
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
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-500/20 flex items-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  Submit Incident Report
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
