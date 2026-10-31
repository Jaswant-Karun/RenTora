import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  FileText,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Hash,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export type IncidentCategory =
  | 'equipment_damage'
  | 'late_return'
  | 'missing_components'
  | 'misuse'
  | 'scheduling_conflicts'
  | 'other';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBookingId?: string;
  defaultBookingRef?: string;
  defaultResourceId?: string;
  defaultResourceName?: string;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultBookingId,
  defaultBookingRef,
  defaultResourceId,
  defaultResourceName,
}) => {
  const [category, setCategory] = useState<IncidentCategory>('equipment_damage');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [bookingRef, setBookingRef] = useState(defaultBookingRef || '');
  const [resourceName, setResourceName] = useState(defaultResourceName || '');
  const [evidence, setEvidence] = useState<string[]>([
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAddEvidencePreset = (url: string) => {
    if (!evidence.includes(url)) {
      setEvidence([...evidence, url]);
    }
  };

  const handleRemoveEvidence = (url: string) => {
    setEvidence(evidence.filter((e) => e !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Detailed incident description is mandatory.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('rentora_token');
      const res = await fetch('http://localhost:5000/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category,
          title: title.trim() || `${category.replace(/_/g, ' ').toUpperCase()}: ${resourceName || 'Asset'}`,
          description: description.trim(),
          evidence,
          severity,
          bookingId: defaultBookingId,
          bookingReference: bookingRef,
          resourceId: defaultResourceId,
          resourceName: resourceName || 'Institutional Asset',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Incident filed and dispatched to Institutional Trust & Safety staff.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error logging incident report.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error reporting incident.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Trust, Safety or Equipment Incident</h3>
              <p className="text-xs text-slate-400">Institutional Safety & Accountability Reporting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Incident Category (Required)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="equipment_damage">Equipment Damage / Physical Wear</option>
                <option value="late_return">Late Return / Time Overstay</option>
                <option value="missing_components">Missing Components / Sub-modules</option>
                <option value="misuse">Misuse / Operational Non-Compliance</option>
                <option value="scheduling_conflicts">Scheduling Conflicts / Double Booking</option>
                <option value="other">Other Campus Safety Incident</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Tier</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="low">Low (Cosmetic/Minor)</option>
                  <option value="medium">Medium (Operation Affected)</option>
                  <option value="high">High (Damaged/Offline)</option>
                  <option value="critical">Critical (Safety Hazard)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-brand-400" /> Booking Ref
                </label>
                <input
                  type="text"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  placeholder="e.g. BK-9841A"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Name</label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="e.g. NVIDIA DGX Station / Laser Cutter"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-brand-400" />
                Incident Description & Statement (Mandatory)
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide precise chronological notes: What occurred, components impacted, and immediate measures taken..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Evidence Attachments */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-brand-400" />
                  Evidence Attachments ({evidence.length} Captured)
                </span>
                <span className="text-[10px] text-slate-400">Photo / log simulator</span>
              </label>

              {evidence.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {evidence.map((url, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-800 group h-20">
                      <img src={url} alt={`Evidence #${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(url)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 text-rose-400 hover:text-white text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleAddEvidencePreset(
                      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3 text-rose-400" />
                  + Damage Photo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddEvidencePreset(
                      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3 text-amber-400" />
                  + Error Log
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2"
              >
                {submitting && <LoadingSpinner size="sm" />}
                Submit Incident Report
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
