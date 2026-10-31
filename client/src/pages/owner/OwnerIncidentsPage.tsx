import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  PlusCircle,
  ShieldAlert,
  Cpu,
  Calendar,
  User,
  X,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Check,
  Loader2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  Upload,
} from 'lucide-react';
import {
  getIncidentsApi,
  getIncidentByIdApi,
  reportIncidentApi,
  addInvestigationNoteApi,
  recordIncidentDecisionApi,
  resolveIncidentApi,
  uploadEvidenceApi,
  IncidentItem,
} from '../../api/conditionGuard.api';
import { getOwnerResourcesApi, getOwnerBookingsApi } from '../../api/owner.api';
import { Resource, Booking } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const OwnerIncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [category, setCategory] = useState('equipment_damage');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentPhotos, setIncidentPhotos] = useState<File[]>([]);
  const [incidentPhotoPreviews, setIncidentPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Detail & Investigation Drawer State
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [investigationNoteInput, setInvestigationNoteInput] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Human Review & Decision State
  const [decisionOutcome, setDecisionOutcome] = useState<
    'no_fault' | 'user_responsible' | 'fair_wear_and_tear' | 'equipment_defect' | 'under_review'
  >('fair_wear_and_tear');
  const [decisionRationale, setDecisionRationale] = useState('');
  const [decisionSanctions, setDecisionSanctions] = useState('none');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Resolution State
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, resRes, bookRes] = await Promise.all([
        getIncidentsApi(),
        getOwnerResourcesApi(),
        getOwnerBookingsApi(),
      ]);

      if (incRes.success) setIncidents(incRes.data);
      if (resRes.success) {
        setResources(resRes.data);
        if (resRes.data.length > 0) setSelectedResourceId(resRes.data[0]._id);
      }
      if (bookRes.success) setBookings(bookRes.data);
    } catch (err) {
      console.error('Error fetching incidents telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenIncidentDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await getIncidentByIdApi(id);
      if (res.success) {
        setSelectedIncident(res.data);
        setInvestigationNoteInput('');
      }
    } catch (err) {
      console.error('Error loading incident details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setIncidentPhotos([...incidentPhotos, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setIncidentPhotoPreviews([...incidentPhotoPreviews, ...newPreviews]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setIncidentPhotos(incidentPhotos.filter((_, i) => i !== index));
    setIncidentPhotoPreviews(incidentPhotoPreviews.filter((_, i) => i !== index));
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setReporting(true);
    try {
      let uploadedUrls: string[] = [];
      if (incidentPhotos.length > 0) {
        setUploadingPhotos(true);
        const uploadRes = await uploadEvidenceApi(incidentPhotos);
        if (uploadRes.success && uploadRes.data?.urls) {
          uploadedUrls = uploadRes.data.urls;
        }
        setUploadingPhotos(false);
      }

      const res = await reportIncidentApi({
        resourceId: selectedResourceId || undefined,
        bookingId: selectedBookingId || undefined,
        category,
        severity,
        title,
        description,
        evidence: uploadedUrls,
      });

      if (res.success) {
        setReportModalOpen(false);
        resetReportForm();
        alert(`Incident report registered successfully with reference number: ${res.data.incidentNumber}`);
        await loadData();
      }
    } catch (err: any) {
      console.error('Error reporting incident:', err);
      alert(err?.response?.data?.message || err.message || 'Error submitting incident report.');
    } finally {
      setReporting(false);
      setUploadingPhotos(false);
    }
  };

  const resetReportForm = () => {
    setTitle('');
    setDescription('');
    setCategory('equipment_damage');
    setSeverity('medium');
    setSelectedBookingId('');
    setIncidentPhotos([]);
    setIncidentPhotoPreviews([]);
  };

  const handleAddInvestigationNote = async () => {
    if (!selectedIncident || !investigationNoteInput.trim()) return;

    setAddingNote(true);
    try {
      const res = await addInvestigationNoteApi(selectedIncident._id, investigationNoteInput.trim());
      if (res.success) {
        setSelectedIncident(res.data);
        setInvestigationNoteInput('');
        await loadData();
      }
    } catch (err: any) {
      console.error('Error adding investigation note:', err);
      alert(err?.response?.data?.message || err.message || 'Failed to append investigation note.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleRecordDecision = async () => {
    if (!selectedIncident) return;
    if (!decisionRationale.trim()) {
      alert('Mandatory human review rationale is required before recording an official outcome.');
      return;
    }

    setSubmittingDecision(true);
    try {
      const res = await recordIncidentDecisionApi(selectedIncident._id, {
        outcome: decisionOutcome,
        rationale: decisionRationale.trim(),
        sanctions: decisionSanctions,
      });

      if (res.success) {
        setSelectedIncident(res.data);
        setDecisionRationale('');
        alert('Human review decision officially registered in the immutable audit ledger.');
        await loadData();
      }
    } catch (err: any) {
      console.error('Error recording decision:', err);
      alert(err?.response?.data?.message || err.message || 'Error recording decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;

    setSubmittingResolution(true);
    try {
      const res = await resolveIncidentApi(selectedIncident._id, {
        status: resolutionStatus,
        resolutionNotes: resolutionSummary || 'Incident resolved after authorized human verification.',
        actionTaken: actionTaken || 'No punitive actions assessed.',
        sanctionsApplied: decisionSanctions || 'none',
        penaltyPoints,
      });

      if (res.success) {
        setSelectedIncident(res.data);
        setResolutionSummary('');
        setActionTaken('');
        alert(`Incident ${res.data.incidentNumber} officially closed and archived.`);
        await loadData();
      }
    } catch (err: any) {
      console.error('Error resolving incident:', err);
      alert(err?.response?.data?.message || err.message || 'Error resolving incident.');
    } finally {
      setSubmittingResolution(false);
    }
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.incidentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || inc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                ConditionGuard – Safety Incidents & Damage Governance
              </h1>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              8-stage incident lifecycle management, human-enforced damage investigation, and transparent audit resolutions.
            </p>
          </div>

          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Safety Incident</span>
          </button>
        </div>
      </div>

      {/* 2. Regulatory Notice Banner */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#1769D2] shrink-0 mt-0.5" />
        <div className="text-xs text-[#172033]">
          <span className="font-bold text-[#1769D2] uppercase text-[11px] block">
            Human-Supervised Fair Governance Safeguard
          </span>
          <p className="text-[#64748B] text-[11px] mt-0.5">
            Automated photo comparison algorithms cannot automatically conclude fault or impose penalties. All equipment damage, disputes, and delayed return findings strictly require authorized human review and signed justification.
          </p>
        </div>
      </div>

      {/* 3. Incidents Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Total Incidents</span>
          <span className="text-xl font-extrabold text-[#172033] mt-1 block">{incidents.length}</span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Official incident files</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Under Investigation</span>
          <span className="text-xl font-extrabold text-[#D97706] mt-1 block">
            {incidents.filter((i) => i.status === 'investigating' || i.status === 'reported').length}
          </span>
          <span className="text-[10px] text-[#D97706] mt-0.5 block font-medium">Active inquiry cases</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Decision Pending</span>
          <span className="text-xl font-extrabold text-indigo-600 mt-1 block">
            {incidents.filter((i) => i.status === 'decision_pending').length}
          </span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Awaiting signoff closure</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Resolved & Archived</span>
          <span className="text-xl font-extrabold text-[#16834A] mt-1 block">
            {incidents.filter((i) => i.status === 'resolved' || i.status === 'dismissed').length}
          </span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Closed with audit trail</span>
        </div>
      </div>

      {/* 4. Filter Toolbar & Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: 'All Incidents' },
              { id: 'equipment_damage', label: 'Damage' },
              { id: 'delayed_return', label: 'Delayed Return' },
              { id: 'missing_components', label: 'Missing Components' },
              { id: 'equipment_malfunction', label: 'Malfunction' },
              { id: 'safety_concerns', label: 'Safety Concerns' },
              { id: 'disputes', label: 'Disputes' },
              { id: 'other', label: 'Other' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === c.id
                    ? 'bg-[#1769D2] text-white shadow-2xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference, resource, person..."
              className="w-full bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] text-xs rounded-lg pl-9 pr-3 py-1.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            />
          </div>
        </div>

        {/* Incidents Table */}
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Incident Ref</th>
                <th className="py-2.5 px-4">Title & Description</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Resource</th>
                <th className="py-2.5 px-4">Severity</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Reported By</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-4 text-center text-[#64748B]">
                      <LoadingSpinner size="sm" />
                    </td>
                  </tr>
                ))
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    No incident records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#1769D2] whitespace-nowrap">
                      {incident.incidentNumber}
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-[#172033] truncate">{incident.title}</div>
                      <div className="text-[10px] text-[#64748B] line-clamp-1">{incident.description}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 capitalize">
                        {incident.category.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-[#172033] max-w-[140px] truncate">
                      {incident.resourceName}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          incident.severity === 'critical'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : incident.severity === 'high'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : incident.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          incident.status === 'resolved'
                            ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                            : incident.status === 'investigating'
                            ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                            : incident.status === 'decision_pending'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : incident.status === 'dismissed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-red-50 text-[#DC2626] border border-red-200'
                        }`}
                      >
                        {incident.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#64748B]">
                      <div className="text-[11px] text-[#172033] font-medium">{incident.reportedBy}</div>
                      <div className="text-[10px]">{new Date(incident.createdAt).toLocaleDateString()}</div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenIncidentDetail(incident._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1769D2] hover:bg-[#1256B0] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Report Incident Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  File Safety Incident Report
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Incident Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                >
                  <option value="equipment_damage">Damage to Equipment</option>
                  <option value="delayed_return">Delayed Return</option>
                  <option value="missing_components">Missing Components / Accessories</option>
                  <option value="equipment_malfunction">Equipment Malfunction / Failure</option>
                  <option value="safety_concerns">Safety Concerns / Hazardous Spill</option>
                  <option value="disputes">User Dispute</option>
                  <option value="other">Other Incident</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Associated Equipment Asset
                </label>
                <select
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  required
                >
                  {resources.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({r.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  >
                    <option value="low">Low (Cosmetic / Minor)</option>
                    <option value="medium">Medium (Standard Review)</option>
                    <option value="high">High (Damaged / Offline)</option>
                    <option value="critical">Critical (Safety Hazard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                    Booking ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectedBookingId}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    placeholder="e.g. 6ae739dda2..."
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lens scratch detected during post-use return"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Detailed Description & Circumstances
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Provide precise details on apparatus condition, suspected cause, and witness details..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  required
                />
              </div>

              {/* Photo Evidence Upload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#64748B] uppercase">
                  Attach Evidence Photos (JPG/PNG under 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#172033] text-xs font-medium cursor-pointer transition-colors border border-slate-300">
                    <Upload className="w-3.5 h-3.5 text-[#1769D2]" />
                    <span>Upload Images</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-[#64748B]">
                    {incidentPhotos.length} file(s) attached
                  </span>
                </div>

                {incidentPhotoPreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {incidentPhotoPreviews.map((src, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                        <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[9px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#172033] text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reporting || uploadingPhotos}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {reporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>File Incident (Assign Reference ID)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Incident Investigation & Human Review Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center font-bold">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1769D2]">
                      {selectedIncident.incidentNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {selectedIncident.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172033] mt-0.5">{selectedIncident.title}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-[#172033] flex-1">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Asset Name:</span>
                  <span className="font-semibold text-slate-800">{selectedIncident.resourceName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Reported By:</span>
                  <span className="font-semibold text-slate-800">{selectedIncident.reportedBy}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Category:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {selectedIncident.category.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Date Registered:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedIncident.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                  Incident Description & Circumstances
                </span>
                <p className="p-3 bg-white border border-[#E2E8F0] rounded-lg text-slate-800 leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              {/* Photo Evidence Gallery */}
              {selectedIncident.evidence && selectedIncident.evidence.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block mb-1.5">
                    Photographic Proof ({selectedIncident.evidence.length} Files Attached)
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedIncident.evidence.map((photo, i) => (
                      <div key={i} className="h-24 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={photo.startsWith('http') || photo.startsWith('/uploads') ? photo : `/uploads/${photo}`}
                          alt="Incident Evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Condition Comparison Differences (if available) */}
              {selectedIncident.comparison && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                  <span className="font-bold text-indigo-900 text-[11px] uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Linked Reservation Condition Discrepancies
                  </span>
                  <div className="divide-y divide-indigo-100">
                    {selectedIncident.comparison.differences.map((diff, i) => (
                      <div key={i} className="py-1.5 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800">{diff.category}</span>
                          <span className="text-slate-500 text-[10px] block">
                            {diff.before} &rarr; {diff.after}
                          </span>
                        </div>
                        {diff.requiresReview && (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Review Required
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investigation Notes Trail (Lifecycle Step 5) */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-[#64748B] uppercase block">
                  Investigation Journal & Forensic Audit Log ({selectedIncident.investigationNotes?.length || 0} entries)
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {selectedIncident.investigationNotes?.map((n, i) => (
                    <div key={i} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold text-[#172033]">
                          {n.authorName} ({n.authorRole})
                        </span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-700">{n.note}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={investigationNoteInput}
                    onChange={(e) => setInvestigationNoteInput(e.target.value)}
                    placeholder="Add forensic observation, witness statement, or testing finding..."
                    className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddInvestigationNote}
                    disabled={addingNote || !investigationNoteInput.trim()}
                    className="px-3.5 py-1.5 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                  >
                    {addingNote ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>

              {/* Human Review Decision Panel (Lifecycle Step 6) */}
              <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172033] text-xs uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1769D2]" />
                    Authorized Human Review & Decision Panel
                  </span>
                  {selectedIncident.decision && (
                    <span className="text-[10px] font-bold text-[#16834A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Decision Signed Off by {selectedIncident.decision.decidedBy}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                      Decision Outcome
                    </label>
                    <select
                      value={decisionOutcome}
                      onChange={(e) => setDecisionOutcome(e.target.value as any)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                    >
                      <option value="fair_wear_and_tear">Fair Wear & Tear (No User Fault)</option>
                      <option value="equipment_defect">Equipment Hardware Defect / Manufacturing</option>
                      <option value="no_fault">No Fault Found / Dismissed</option>
                      <option value="user_responsible">User Responsible / Operational Negligence</option>
                      <option value="under_review">Under Active External Review</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                      Sanctions Assessment
                    </label>
                    <input
                      type="text"
                      value={decisionSanctions}
                      onChange={(e) => setDecisionSanctions(e.target.value)}
                      placeholder="e.g. none, mandatory retraining, verbal warning"
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                    Human Review Rationale (Mandatory Legal / Institutional Record)
                  </label>
                  <textarea
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    rows={2}
                    placeholder="Explain the investigative facts leading to this decision..."
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRecordDecision}
                    disabled={submittingDecision || !decisionRationale.trim()}
                    className="px-3.5 py-1.5 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                  >
                    {submittingDecision ? 'Signing...' : 'Sign Off Human Decision'}
                  </button>
                </div>
              </div>

              {/* Final Resolution & Closure (Lifecycle Step 7 & 8) */}
              <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3">
                <span className="font-bold text-[#16834A] text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16834A]" />
                  Official Incident Resolution & Archival
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                      Resolution State
                    </label>
                    <select
                      value={resolutionStatus}
                      onChange={(e) => setResolutionStatus(e.target.value as any)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                    >
                      <option value="resolved">Resolved (Action Finalized)</option>
                      <option value="dismissed">Dismissed (No Action Required)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                      Corrective Action Taken
                    </label>
                    <input
                      type="text"
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      placeholder="e.g. Ultrasonic cleaning, optical recalibration"
                      className="w-full bg-white border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                    Final Resolution Summary Notes
                  </label>
                  <textarea
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    rows={2}
                    placeholder="Summary of closing actions and apparatus operational status..."
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleResolveIncident}
                    disabled={submittingResolution}
                    className="px-4 py-2 bg-[#16834A] hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    {submittingResolution ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Close & Archive Incident</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-[#E2E8F0] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-1.5 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#172033] text-xs font-semibold rounded-lg"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerIncidentsPage;
