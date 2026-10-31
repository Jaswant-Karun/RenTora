import React, { useState, useEffect } from 'react';
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
  Upload,
  Camera,
  Layers,
  ArrowRight,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  AlertCircle,
  Check,
  Loader2,
  Gauge,
  Sparkles,
} from 'lucide-react';
import {
  getConditionReportsApi,
  recordBeforeCheckInApi,
  recordAfterCheckOutApi,
  getConditionComparisonApi,
  uploadEvidenceApi,
  reportIncidentApi,
  ConditionReportItem,
  ConditionComparisonData,
} from '../../api/conditionGuard.api';
import { getOwnerResourcesApi, getOwnerBookingsApi } from '../../api/owner.api';
import { Resource, Booking } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ConditionReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ConditionReportItem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'check_in' | 'check_out' | 'routine'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Inspection Modal State
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [inspectionType, setInspectionType] = useState<'check_in' | 'check_out' | 'routine'>('check_in');
  const [operationalStatus, setOperationalStatus] = useState<'optimal' | 'minor_wear' | 'damaged' | 'offline'>('optimal');
  const [cleanliness, setCleanliness] = useState<'passed' | 'needs_cleaning'>('passed');
  const [meterReading, setMeterReading] = useState('0');
  const [conditionNotes, setConditionNotes] = useState('');
  const [damageInput, setDamageInput] = useState('');
  const [existingDamageList, setExistingDamageList] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [userConfirmed, setUserConfirmed] = useState(true);

  // Comparison Modal State
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<ConditionComparisonData | null>(null);

  // Detail Modal State
  const [detailModalReport, setDetailModalReport] = useState<ConditionReportItem | null>(null);

  // Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateCategory, setEscalateCategory] = useState('equipment_damage');
  const [escalateSeverity, setEscalateSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [escalateTitle, setEscalateTitle] = useState('');
  const [escalateDescription, setEscalateDescription] = useState('');
  const [escalating, setEscalating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportsRes, resourcesRes, bookingsRes] = await Promise.all([
        getConditionReportsApi(),
        getOwnerResourcesApi(),
        getOwnerBookingsApi(),
      ]);

      if (reportsRes.success) setReports(reportsRes.data);
      if (resourcesRes.success) {
        setResources(resourcesRes.data);
        if (resourcesRes.data.length > 0) setSelectedResourceId(resourcesRes.data[0]._id);
      }
      if (bookingsRes.success) setBookings(bookingsRes.data);
    } catch (err) {
      console.error('Error fetching ConditionGuard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddDamageItem = () => {
    if (damageInput.trim()) {
      setExistingDamageList([...existingDamageList, damageInput.trim()]);
      setDamageInput('');
    }
  };

  const handleRemoveDamageItem = (index: number) => {
    setExistingDamageList(existingDamageList.filter((_, i) => i !== index));
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotoFiles([...photoFiles, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setPhotoPreviews([...photoPreviews, ...newPreviews]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let uploadedUrls: string[] = [];
      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        const uploadRes = await uploadEvidenceApi(photoFiles);
        if (uploadRes.success && uploadRes.data?.urls) {
          uploadedUrls = uploadRes.data.urls;
        }
        setUploadingPhotos(false);
      }

      if (inspectionType === 'check_in') {
        if (!selectedBookingId) {
          alert('Please select an active approved booking to attach pre-check-in verification.');
          setSubmitting(false);
          return;
        }

        await recordBeforeCheckInApi({
          bookingId: selectedBookingId,
          operationalStatus,
          cleanliness,
          meterReading,
          existingDamage: existingDamageList,
          conditionNotes,
          observations: conditionNotes || 'Pre-use visual and operational checklist completed.',
          photos: uploadedUrls,
          userConfirmation: userConfirmed,
        });
      } else if (inspectionType === 'check_out') {
        if (!selectedBookingId) {
          alert('Please select an active reservation to log check-out condition.');
          setSubmitting(false);
          return;
        }

        const res = await recordAfterCheckOutApi({
          bookingId: selectedBookingId,
          operationalStatus,
          cleanliness,
          meterReading,
          conditionNotes,
          observations: conditionNotes || 'Post-return verification logged.',
          photos: uploadedUrls,
          userConfirmation: userConfirmed,
        });

        // If differences detected, automatically preview comparison
        if (res.data?.comparison?.hasDifferences) {
          setComparisonData(res.data.comparison);
          setComparisonModalOpen(true);
        }
      }

      setNewModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      console.error('Error submitting condition report:', err);
      alert(err?.response?.data?.message || err.message || 'Error recording condition report.');
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  };

  const resetForm = () => {
    setInspectionType('check_in');
    setOperationalStatus('optimal');
    setCleanliness('passed');
    setMeterReading('0');
    setConditionNotes('');
    setDamageInput('');
    setExistingDamageList([]);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setUserConfirmed(true);
  };

  const handleOpenComparison = async (bookingId?: string) => {
    if (!bookingId) return;
    setComparisonLoading(true);
    setComparisonModalOpen(true);
    try {
      const res = await getConditionComparisonApi(bookingId);
      if (res.success) {
        setComparisonData(res.data);
      }
    } catch (err) {
      console.error('Error loading comparison:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleStartEscalation = (comp: ConditionComparisonData) => {
    setEscalateCategory(comp.afterReport?.operationalStatus === 'damaged' ? 'equipment_damage' : 'misuse');
    setEscalateTitle(`Discrepancy: ${comp.resourceName} (${comp.borrower.name})`);
    const diffsSummary = comp.differences.map((d) => `• ${d.category}: ${d.before} -> ${d.after}`).join('\n');
    setEscalateDescription(
      `Condition differences flagged during post-use check-out inspection for booking ${comp.bookingId}:\n\n${diffsSummary}\n\nNotes from inspection: ${comp.afterReport?.conditionNotes || 'N/A'}`
    );
    setComparisonModalOpen(false);
    setEscalateModalOpen(true);
  };

  const handleConfirmEscalation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comparisonData) return;

    setEscalating(true);
    try {
      const res = await reportIncidentApi({
        bookingId: comparisonData.bookingId,
        resourceId: comparisonData.resourceId,
        resourceName: comparisonData.resourceName,
        category: escalateCategory,
        severity: escalateSeverity,
        title: escalateTitle,
        description: escalateDescription,
        evidence: comparisonData.afterReport?.photos || [],
      });

      if (res.success) {
        setEscalateModalOpen(false);
        alert(`Incident report ${res.data?.incidentNumber} registered successfully. Dispatched for authorized human review.`);
        await loadData();
      }
    } catch (err: any) {
      console.error('Error escalating incident:', err);
      alert(err?.response?.data?.message || err.message || 'Failed to file incident report.');
    } finally {
      setEscalating(false);
    }
  };

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.resourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.inspectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.responsibleUserName && r.responsibleUserName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || r.operationalStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#1769D2]" />
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                ConditionGuard – Equipment Condition & Audit Ledger
              </h1>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Pre-check-in verification, return inspection audits, photographic evidence chain of custody, and human-supervised comparison.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setInspectionType('check_in');
                setNewModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Condition Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Total Audits</span>
          <span className="text-xl font-extrabold text-[#172033] mt-1 block">{reports.length}</span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Historical inspections logged</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Pre-Check-In Baselines</span>
          <span className="text-xl font-extrabold text-[#1769D2] mt-1 block">
            {reports.filter((r) => r.type === 'check_in').length}
          </span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Equipment handover snapshots</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Return Inspections</span>
          <span className="text-xl font-extrabold text-[#16834A] mt-1 block">
            {reports.filter((r) => r.type === 'check_out').length}
          </span>
          <span className="text-[10px] text-[#64748B] mt-0.5 block">Completed return check-outs</span>
        </div>

        <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Review Flagged</span>
          <span className="text-xl font-extrabold text-[#D97706] mt-1 block">
            {reports.filter((r) => r.requiresHumanReview || r.differences?.hasDifferences).length}
          </span>
          <span className="text-[10px] text-[#D97706] mt-0.5 block font-medium">Differences awaiting review</span>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Type Filter Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: 'All Reports' },
              { id: 'check_in', label: 'Pre-Use Check-in' },
              { id: 'check_out', label: 'Post-Use Return' },
              { id: 'routine', label: 'Routine Inspection' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  typeFilter === t.id
                    ? 'bg-[#1769D2] text-white shadow-2xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
                }`}
              >
                {t.label}
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
              placeholder="Search resource, inspector, borrower..."
              className="w-full bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] text-xs rounded-lg pl-9 pr-3 py-1.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            />
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto border border-[#E2E8F0] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-semibold">
              <tr>
                <th className="py-2.5 px-4">Resource & Asset</th>
                <th className="py-2.5 px-4">Inspection Type</th>
                <th className="py-2.5 px-4">Operational Status</th>
                <th className="py-2.5 px-4">Cleanliness</th>
                <th className="py-2.5 px-4">Meter Reading</th>
                <th className="py-2.5 px-4">Differences / Review</th>
                <th className="py-2.5 px-4">Timestamp & Inspector</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-4 px-4 text-center text-[#64748B]">
                      <LoadingSpinner size="sm" />
                    </td>
                  </tr>
                ))
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B]">
                    No condition reports found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#172033]">{report.resourceName}</div>
                      {report.responsibleUserName && (
                        <div className="text-[10px] text-[#64748B]">Borrower: {report.responsibleUserName}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          report.type === 'check_in'
                            ? 'bg-blue-50 text-[#1769D2] border border-blue-200'
                            : report.type === 'check_out'
                            ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {report.type === 'check_in'
                          ? 'Pre-Use Check-In'
                          : report.type === 'check_out'
                          ? 'Post-Use Return'
                          : 'Routine Inspection'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                          report.operationalStatus === 'optimal'
                            ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                            : report.operationalStatus === 'minor_wear'
                            ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                            : 'bg-red-50 text-[#DC2626] border border-red-200'
                        }`}
                      >
                        {report.operationalStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold ${
                          report.cleanliness === 'passed' ? 'text-[#16834A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {report.cleanliness === 'passed' ? 'Passed (Clean)' : 'Needs Cleaning'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#172033]">
                      {report.meterReading || '0'}
                    </td>

                    <td className="py-3 px-4">
                      {report.differences?.hasDifferences ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-[#D97706]" />
                          Diff Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16834A]">
                          <Check className="w-3 h-3 text-[#16834A]" />
                          Baseline Match
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#64748B]">
                      <div className="text-[11px] text-[#172033] font-medium">
                        {new Date(report.timestamp || report.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px]">{report.inspectorName}</div>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Report Detail */}
                        <button
                          type="button"
                          onClick={() => setDetailModalReport(report)}
                          className="p-1.5 text-[#64748B] hover:text-[#1769D2] hover:bg-[#EFF6FF] rounded transition-colors"
                          title="View Full Condition Report & Photos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* View Side-by-Side Comparison (if booking linked) */}
                        {report.bookingId && (
                          <button
                            type="button"
                            onClick={() => handleOpenComparison(report.bookingId)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                            title="Side-by-side Before/After Comparison"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Log Condition Inspection Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-[#1769D2]" />
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  ConditionGuard™ Inspection Entry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewModalOpen(false);
                  resetForm();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4 text-xs">
              {/* Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#172033] uppercase mb-1.5">
                  Inspection Stage
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectionType('check_in')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      inspectionType === 'check_in'
                        ? 'border-[#1769D2] bg-blue-50/50 text-[#1769D2] font-bold'
                        : 'border-[#E2E8F0] bg-white text-[#64748B]'
                    }`}
                  >
                    <span className="block font-bold">1. Pre-Use Handover Inspection</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Record baseline condition, existing scratches/flaws & pre-use photos
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectionType('check_out')}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      inspectionType === 'check_out'
                        ? 'border-[#1769D2] bg-blue-50/50 text-[#1769D2] font-bold'
                        : 'border-[#E2E8F0] bg-white text-[#64748B]'
                    }`}
                  >
                    <span className="block font-bold">2. Post-Use Return Audit</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Record return condition & compute differences for human review
                    </span>
                  </button>
                </div>
              </div>

              {/* Linked Booking Picker */}
              <div>
                <label className="block text-[11px] font-bold text-[#172033] uppercase mb-1">
                  Select Associated Equipment Reservation
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1769D2]"
                  required
                >
                  <option value="">-- Choose active reservation --</option>
                  {bookings
                    .filter((b) => b.status === 'approved' || b.status === 'checked_in' || b.status === 'completed')
                    .map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.resourceName} | Borrower: {b.userName} ({b.date} {b.timeSlot}) [{b.status.toUpperCase()}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Operational Status & Cleanliness Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                    Operational State
                  </label>
                  <select
                    value={operationalStatus}
                    onChange={(e) => setOperationalStatus(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  >
                    <option value="optimal">Optimal / Calibrated</option>
                    <option value="minor_wear">Minor Cosmetic Wear</option>
                    <option value="damaged">Damaged / Non-operational</option>
                    <option value="offline">Offline / Fault</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                    Cleanliness Standard
                  </label>
                  <select
                    value={cleanliness}
                    onChange={(e) => setCleanliness(e.target.value as any)}
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  >
                    <option value="passed">Passed (Lab Specification)</option>
                    <option value="needs_cleaning">Needs Cleaning / Decontamination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                    Meter Reading (Hrs / Units)
                  </label>
                  <input
                    type="text"
                    value={meterReading}
                    onChange={(e) => setMeterReading(e.target.value)}
                    placeholder="e.g. 142.5 hrs"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  />
                </div>
              </div>

              {/* Existing Damage Checklist (Pre-check-in specific) */}
              {inspectionType === 'check_in' && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                  <label className="block text-[10px] font-bold text-[#172033] uppercase">
                    Record Pre-Existing Damage & Flaws (Protects Student)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={damageInput}
                      onChange={(e) => setDamageInput(e.target.value)}
                      placeholder="e.g. Hairline scratch on base plate; USB slot 2 loose"
                      className="flex-1 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs text-[#172033]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDamageItem();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddDamageItem}
                      className="px-3 py-1.5 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold rounded-lg"
                    >
                      Add Note
                    </button>
                  </div>

                  {existingDamageList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {existingDamageList.map((dmg, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px]"
                        >
                          <span>{dmg}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDamageItem(idx)}
                            className="text-amber-600 hover:text-amber-900 ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Photo Evidence Upload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#64748B] uppercase">
                  Supporting Photographic Evidence (Max 5 images, JPG/PNG under 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#172033] text-xs font-medium cursor-pointer transition-colors border border-slate-300">
                    <Camera className="w-4 h-4 text-[#1769D2]" />
                    <span>Upload Inspection Photos</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-[#64748B]">
                    {photoFiles.length} photo(s) selected
                  </span>
                </div>

                {photoPreviews.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto py-2">
                    {photoPreviews.map((src, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inspection Notes & Observations */}
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Inspector Notes & Checklist Observations
                </label>
                <textarea
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  rows={2}
                  placeholder="Record optical calibration values, stage alignment, cable integrity, or returned condition notes..."
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 text-xs text-[#172033] focus:bg-white focus:outline-none focus:border-[#1769D2]"
                  required
                />
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <input
                  type="checkbox"
                  id="userConfirmed"
                  checked={userConfirmed}
                  onChange={(e) => setUserConfirmed(e.target.checked)}
                  className="rounded text-[#1769D2] focus:ring-[#1769D2]"
                />
                <label htmlFor="userConfirmed" className="text-[11px] text-[#172033] font-medium">
                  Verified with borrower present. Mutual inspection signoff acknowledged.
                </label>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#172033] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingPhotos}
                  className="px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Audit...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Sign Off Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Side-by-Side Condition Comparison Modal */}
      {comparisonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  ConditionGuard™ Comparative Audit Analysis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setComparisonModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-[#172033]">
              {comparisonLoading ? (
                <div className="py-12 flex justify-center items-center">
                  <LoadingSpinner message="Aggregating pre-use baseline and return inspection telemetry..." size="md" />
                </div>
              ) : comparisonData ? (
                <>
                  {/* Regulatory Safeguard Notice */}
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">
                        Institutional Human-Review Safeguard Enforced
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {comparisonData.humanReviewNotice}
                      </p>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">Apparatus Asset</span>
                      <span className="font-bold text-[#172033]">{comparisonData.resourceName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block">Borrower</span>
                      <span className="font-semibold text-[#172033]">{comparisonData.borrower.name}</span>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before Handover Column */}
                    <div className="p-4 bg-slate-50/50 border border-[#E2E8F0] rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                        <span className="font-bold text-[#1769D2] uppercase text-[11px]">
                          1. Pre-Use Handover Baseline
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {comparisonData.beforeReport
                            ? new Date(comparisonData.beforeReport.timestamp).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>

                      {comparisonData.beforeReport ? (
                        <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Operational:</span>
                            <span className="font-bold capitalize text-slate-800">
                              {comparisonData.beforeReport.operationalStatus}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Cleanliness:</span>
                            <span className="font-bold capitalize text-slate-800">
                              {comparisonData.beforeReport.cleanliness}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Meter Reading:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {comparisonData.beforeReport.meterReading || '0'}
                            </span>
                          </div>
                          {comparisonData.beforeReport.existingDamage &&
                            comparisonData.beforeReport.existingDamage.length > 0 && (
                              <div className="pt-1">
                                <span className="text-slate-500 block text-[10px] font-bold">Recorded Existing Flaws:</span>
                                <ul className="list-disc pl-4 text-[10px] text-slate-600 space-y-0.5 mt-0.5">
                                  {comparisonData.beforeReport.existingDamage.map((d, i) => (
                                    <li key={i}>{d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          <div className="pt-1 border-t border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Inspector Notes:</span>
                            <p className="text-slate-700 text-[10px] mt-0.5">
                              {comparisonData.beforeReport.conditionNotes || 'Clean baseline.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 py-6 text-center">No pre-use report on record.</p>
                      )}
                    </div>

                    {/* After Return Column */}
                    <div className="p-4 bg-slate-50/50 border border-[#E2E8F0] rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                        <span className="font-bold text-[#16834A] uppercase text-[11px]">
                          2. Post-Use Return Inspection
                        </span>
                        <span className="text-[10px] text-[#64748B]">
                          {comparisonData.afterReport
                            ? new Date(comparisonData.afterReport.timestamp).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>

                      {comparisonData.afterReport ? (
                        <div className="space-y-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Operational:</span>
                            <span
                              className={`font-bold capitalize ${
                                comparisonData.afterReport.operationalStatus !== 'optimal'
                                  ? 'text-red-700'
                                  : 'text-slate-800'
                              }`}
                            >
                              {comparisonData.afterReport.operationalStatus}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Cleanliness:</span>
                            <span
                              className={`font-bold capitalize ${
                                comparisonData.afterReport.cleanliness !== 'passed'
                                  ? 'text-amber-700'
                                  : 'text-slate-800'
                              }`}
                            >
                              {comparisonData.afterReport.cleanliness}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Return Meter:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {comparisonData.afterReport.meterReading || '0'}
                            </span>
                          </div>
                          <div className="pt-1 border-t border-slate-200">
                            <span className="text-slate-500 block text-[10px]">Return Notes:</span>
                            <p className="text-slate-700 text-[10px] mt-0.5">
                              {comparisonData.afterReport.conditionNotes || 'Returned.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 py-6 text-center">No return report on record.</p>
                      )}
                    </div>
                  </div>

                  {/* Highlighted Differences Card */}
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                    <h4 className="font-bold text-[#172033] text-xs uppercase flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-[#D97706]" />
                      Comparative Differences Flagged for Human Review
                    </h4>
                    {comparisonData.differences.length === 0 ? (
                      <p className="text-[#16834A] text-xs font-semibold py-2">
                        ✓ No operational or cleanliness discrepancies detected between pre-use and post-use states.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200">
                        {comparisonData.differences.map((diff, i) => (
                          <div key={i} className="py-2 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-[#172033] block">{diff.category}</span>
                              <span className="text-[#64748B] text-[11px]">
                                {diff.before} &rarr; {diff.after}
                              </span>
                            </div>
                            {diff.requiresReview && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                Requires Review
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setComparisonModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-slate-100 text-[#172033] text-xs font-semibold rounded-lg"
                >
                  Close Comparison
                </button>
                {comparisonData?.hasDifferences && (
                  <button
                    type="button"
                    onClick={() => handleStartEscalation(comparisonData)}
                    className="px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Escalate to Human Incident Review</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Escalate Incident Modal */}
      {escalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden my-8">
            <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider">
                  Escalate Condition Difference to Incident
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscalateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEscalation} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Incident Category
                </label>
                <select
                  value={escalateCategory}
                  onChange={(e) => setEscalateCategory(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                >
                  <option value="equipment_damage">Equipment Damage</option>
                  <option value="delayed_return">Delayed Return</option>
                  <option value="missing_components">Missing Components</option>
                  <option value="equipment_malfunction">Equipment Malfunction</option>
                  <option value="safety_concerns">Safety Concerns</option>
                  <option value="disputes">Disputes</option>
                  <option value="other">Other Incident</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Incident Title
                </label>
                <input
                  type="text"
                  value={escalateTitle}
                  onChange={(e) => setEscalateTitle(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748B] uppercase mb-1">
                  Investigation Description & Comparison Diffs
                </label>
                <textarea
                  value={escalateDescription}
                  onChange={(e) => setEscalateDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2 text-xs text-[#172033]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setEscalateModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#172033] text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalating}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  {escalating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Submit Incident for Human Investigation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Single Report Detail Modal */}
      {detailModalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden my-8">
            <div className="p-4 bg-slate-50 border-b border-[#E2E8F0] flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-[#172033]">
                Inspection Audit Snapshot: {detailModalReport.resourceName}
              </span>
              <button
                type="button"
                onClick={() => setDetailModalReport(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Stage:</span>
                  <span className="font-bold text-slate-800 uppercase">{detailModalReport.type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Inspector:</span>
                  <span className="font-bold text-slate-800">{detailModalReport.inspectorName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Operational:</span>
                  <span className="font-bold text-slate-800 capitalize">{detailModalReport.operationalStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Cleanliness:</span>
                  <span className="font-bold text-slate-800 capitalize">{detailModalReport.cleanliness}</span>
                </div>
              </div>

              {detailModalReport.existingDamage && detailModalReport.existingDamage.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase">Pre-Existing Flaws Logged:</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-0.5 mt-1">
                    {detailModalReport.existingDamage.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 block text-[10px] uppercase">Notes:</span>
                <p className="text-slate-600 mt-0.5">{detailModalReport.conditionNotes || 'N/A'}</p>
              </div>

              {detailModalReport.photos && detailModalReport.photos.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase mb-1.5">
                    Photographic Proof ({detailModalReport.photos.length} Images)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {detailModalReport.photos.map((photo, i) => (
                      <div key={i} className="h-20 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={photo.startsWith('http') || photo.startsWith('/uploads') ? photo : `/uploads/${photo}`}
                          alt="Evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConditionReportsPage;
