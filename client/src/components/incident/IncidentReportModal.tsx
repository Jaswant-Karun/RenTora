import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Hash,
  X,
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
  booking?: any;
  defaultBookingId?: string;
  defaultBookingRef?: string;
  defaultResourceId?: string;
  defaultResourceName?: string;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  booking,
  defaultBookingId,
  defaultBookingRef,
  defaultResourceId,
  defaultResourceName,
}) => {
  const [category, setCategory] = useState<IncidentCategory>('equipment_damage');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [bookingRef, setBookingRef] = useState(
    defaultBookingRef || (booking ? booking._id?.slice(-8).toUpperCase() : '')
  );
  const [resourceName, setResourceName] = useState(
    defaultResourceName || (booking ? (booking.resourceName || booking.resource?.name || '') : '')
  );
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
        setSuccessMsg('Incident reported successfully. Safety coordinators notified.');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Error creating incident ticket.');
      }
    } catch (err: any) {
      setErrorMsg('Network error connecting to incident registry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-lg rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-[#DC2626] border border-red-200 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#172033]">Report Trust & Safety Incident</h3>
              <p className="text-xs text-[#64748B]">Institutional Safety & Accountability Reporting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16834A] text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Incident Category (Required)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
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
                <label className="block text-xs font-semibold text-[#172033] mb-1">Severity Tier</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                >
                  <option value="low">Low (Cosmetic/Minor)</option>
                  <option value="medium">Medium (Operation Affected)</option>
                  <option value="high">High (Damaged/Offline)</option>
                  <option value="critical">Critical (Safety Hazard)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-[#1769D2]" /> Booking Ref
                </label>
                <input
                  type="text"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value)}
                  placeholder="e.g. BK-9841A"
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Asset Name</label>
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="e.g. NVIDIA DGX Station / Laser Cutter"
                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1769D2]" />
                Incident Description & Statement (Mandatory)
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide precise chronological notes: What occurred, components impacted, and immediate measures taken..."
                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
              />
            </div>

            {/* Evidence Attachments */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#172033] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#1769D2]" />
                  Evidence Attachments ({evidence.length} Captured)
                </span>
                <span className="text-[10px] text-[#64748B]">Photo / log simulator</span>
              </label>

              {evidence.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {evidence.map((url, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-[#E2E8F0] group h-20">
                      <img src={url} alt={`Evidence #${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(url)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-white/90 text-[#DC2626] hover:bg-white text-[10px] shadow"
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
                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#172033] hover:bg-slate-100 flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3 text-[#DC2626]" />
                  + Damage Photo
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddEvidencePreset(
                      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] text-[#172033] hover:bg-slate-100 flex items-center gap-1"
                >
                  <ImageIcon className="w-3 h-3 text-[#D97706]" />
                  + Error Log
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#172033] text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="px-5 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
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
