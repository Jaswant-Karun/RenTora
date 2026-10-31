import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerIncidentsApi, createIncidentApi, getOwnerResourcesApi } from '../../api/owner.api';
import { Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  AlertTriangle,
  PlusCircle,
  ShieldAlert,
  Cpu,
  Calendar,
  User,
  X,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
            Safety Incidents & Breaches
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Safety incident logging, emergency shutdowns, and hazard mitigating corrective actions.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Log Safety Incident
        </button>
      </div>

      {/* Incidents Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Querying active incident reports..." size="md" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white">
          <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#172033]">Zero reported safety incidents</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            All registered facilities are operating cleanly within safety standards.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.map((inc) => (
            <motion.div
              key={inc._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#E2E8F0] bg-white p-5 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      inc.severity === 'critical'
                        ? 'bg-red-50 text-[#DC2626] border border-red-200'
                        : inc.severity === 'high'
                        ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                        : 'bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20'
                    }`}
                  >
                    {inc.severity} Severity
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      inc.status === 'resolved'
                        ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                        : 'bg-amber-50 text-[#D97706] border border-amber-200'
                    }`}
                  >
                    {inc.status || 'open'}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  <h3 className="text-sm font-bold text-[#172033] line-clamp-1">{inc.title}</h3>

                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <Cpu className="w-3.5 h-3.5 text-[#1769D2]" />
                    <span className="truncate">{inc.resource?.name || inc.resourceName || 'Resource Asset'}</span>
                  </div>

                  <p className="text-xs text-[#172033] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] leading-relaxed">
                    {inc.description}
                  </p>

                  {inc.actionTaken && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#16834A]">
                      <span className="font-semibold block mb-0.5">Corrective Action Taken:</span>
                      <span>{inc.actionTaken}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-[#64748B]" />
                  {inc.reportedBy?.name || 'Lab Staff'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#64748B]" />
                  {new Date(inc.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Log Incident Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Log Safety Incident</h3>
                  <p className="text-xs text-[#64748B]">Institutional Hazard & Safety Registry</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Target Equipment</label>
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
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Severity Rating</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                  >
                    <option value="low">Low (Minor anomaly)</option>
                    <option value="medium">Medium (Requires service)</option>
                    <option value="high">High (Damaged/Offline)</option>
                    <option value="critical">Critical (Immediate shutdown)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">Incident Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laser diode overheat fault"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Incident Narrative & Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail sequence of events, borrower present, sensors triggered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Immediate Corrective Action Taken
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency stop depressed, breaker isolated, technician dispatched"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
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
                  disabled={submitting || !title.trim() || !description.trim()}
                  className="px-5 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  Submit Incident
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default OwnerIncidentsPage;
