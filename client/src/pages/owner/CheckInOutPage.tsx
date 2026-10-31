import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOwnerBookingsApi } from '../../api/owner.api';
import {
  verifyTrustPassApi,
  checkInTrustPassApi,
  checkOutTrustPassApi,
  TrustPassVerificationData,
} from '../../api/trustpass.api';
import { Booking } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  QrCode,
  LogOut,
  Clock,
  User,
  Cpu,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  Search,
  Sparkles,
  Layers,
  Gauge,
  Image,
  RefreshCw,
  Plus,
  Trash2,
  KeyRound,
  Check,
} from 'lucide-react';

export const CheckInOutPage: React.FC = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification Input Modes: 'scanner' | 'manual'
  const [verifyMode, setVerifyMode] = useState<'scanner' | 'manual'>('manual');
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<TrustPassVerificationData | null>(null);

  // Camera Simulator States
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Condition Inspection Form States
  const [conditionNotes, setConditionNotes] = useState('');
  const [meterReading, setMeterReading] = useState('');
  const [cleanliness, setCleanliness] = useState<'passed' | 'needs_cleaning'>('passed');
  const [operationalStatus, setOperationalStatus] = useState<'optimal' | 'minor_wear' | 'damaged' | 'offline'>('optimal');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photosList, setPhotosList] = useState<string[]>([]);
  const [submittingAction, setSubmittingAction] = useState(false);

  // List Search & Filter
  const [search, setSearch] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getOwnerBookingsApi();
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle Token Verification (via Scan or Manual Fallback)
  const handleVerify = async (tokenToVerify?: string) => {
    const rawToken = tokenToVerify || tokenInput;
    if (!rawToken.trim()) {
      toast.error('Please enter a TrustPass token or booking ID.');
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyTrustPassApi(rawToken.trim());
      if (res.success && res.data) {
        setVerificationResult(res.data);
        // Pre-fill defaults
        setConditionNotes(
          res.data.actionAllowed === 'check_in'
            ? 'Handover completed in optimal operational condition.'
            : 'Equipment return verified and returned to storage rack.'
        );
        setMeterReading('0');
        setCleanliness('passed');
        setOperationalStatus('optimal');
        setPhotosList([]);
        toast.success(`TrustPass verified for ${res.data.booking?.userName || 'researcher'}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification failed. Unrecognized token.');
      setVerificationResult(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleAddPhoto = () => {
    if (!photoUrlInput.trim()) return;
    setPhotosList([...photosList, photoUrlInput.trim()]);
    setPhotoUrlInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotosList(photosList.filter((_, i) => i !== index));
  };

  // Submit Handover (Check-in or Check-out)
  const handleExecuteHandover = async () => {
    if (!verificationResult) return;
    const { actionAllowed, booking } = verificationResult;

    setSubmittingAction(true);
    try {
      if (actionAllowed === 'check_in') {
        const res = await checkInTrustPassApi({
          bookingId: booking._id,
          conditionNotes,
          meterReading,
          cleanliness,
          operationalStatus,
          photos: photosList,
        });
        if (res.success) {
          toast.success(`Check-in confirmed for ${booking.userName}. Session active!`);
          setVerificationResult(null);
          setTokenInput('');
          await fetchBookings();
        }
      } else {
        const res = await checkOutTrustPassApi({
          bookingId: booking._id,
          conditionNotes,
          meterReading,
          cleanliness,
          operationalStatus,
          photos: photosList,
        });
        if (res.success) {
          const overtime = res.data?.overdueMinutes || 0;
          toast.success(
            overtime > 0
              ? `Return processed (${overtime}m overtime). Session closed.`
              : `Return completed in optimal condition. Session closed!`
          );
          setVerificationResult(null);
          setTokenInput('');
          await fetchBookings();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Handover execution failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const activeBookings = bookings.filter(
    (b) => b.status === 'approved' || b.status === 'checked_in' || b.status === 'return_pending' || b.status === 'active'
  );

  const filteredBookings = activeBookings.filter((b) => {
    const query = search.toLowerCase();
    return (
      (b.resourceName || '').toLowerCase().includes(query) ||
      (b.userName || '').toLowerCase().includes(query) ||
      b._id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                TrustPass – Handover & Return Verification
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Cryptographic optical token validation, condition snapshots, and non-repudiation audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{bookings.filter((b) => b.status === 'checked_in').length} In-Session</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{bookings.filter((b) => b.status === 'approved').length} Awaiting Check-In</span>
          </div>
        </div>
      </div>

      {/* 2. Main Verification Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner / Manual Entry Interface */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-5">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-slate-400" />
                <span>Verification Method</span>
              </span>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMode('manual');
                    setIsCameraActive(false);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    verifyMode === 'manual'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Manual Token</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMode('scanner');
                    setIsCameraActive(true);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    verifyMode === 'scanner'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Scanner</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Mobile-friendly Camera Scanner */}
            {verifyMode === 'scanner' && (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl bg-slate-900 border-2 border-dashed border-indigo-400/50 overflow-hidden flex flex-col items-center justify-center p-6 text-center shadow-inner">
                  {/* Optical Scanning Target Reticle */}
                  <div className="relative w-48 h-48 border-2 border-indigo-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse top-1/2" />
                    <QrCode className="w-20 h-20 text-indigo-300/40" />
                    <span className="absolute bottom-2 text-[10px] font-mono text-indigo-300 tracking-wider">
                      ALIGN QR CODE
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-4 max-w-xs">
                    Hold the student's digital or printed TrustPass reservation pass inside the targeting reticle.
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                      Optical Sensor Active
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Camera unavailable or permission denied?</span>
                  <button
                    type="button"
                    onClick={() => setVerifyMode('manual')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Use Secure Fallback
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Manual Passcode Fallback Input */}
            {verifyMode === 'manual' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    TrustPass Digital Token or Reservation ID <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="e.g. TP-9A7F8B4C2D... or 6ae731..."
                      className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all pr-10"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1.5">
                    Enter the encrypted token from the borrower's pass or select an active session from the registry below.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying || !tokenInput.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {verifying ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify TrustPass on Ledger</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Quick Select Table of Today's Eligible Handover Sessions */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Today's Active Handover Registry</span>
              </h3>
              <span className="text-[11px] text-slate-500">{filteredBookings.length} sessions queued</span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by researcher name, asset, or ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredBookings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No active handover bookings match your search.
                </div>
              ) : (
                filteredBookings.map((b) => (
                  <div
                    key={b._id}
                    onClick={() => {
                      setTokenInput(b._id);
                      handleVerify(b._id);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      verificationResult?.booking?._id === b._id
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-[#E2E8F0] hover:border-indigo-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {b.resourceName}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            b.status === 'checked_in'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {b.status === 'checked_in' ? 'In Use' : 'Ready to Check In'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {b.userName} • {b.date} ({b.timeSlot})
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-indigo-50 hover:text-indigo-600 text-xs font-medium rounded-lg shrink-0 transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Verification Resolution & Condition Inspection Form */}
        <div className="lg:col-span-6 space-y-6">
          {verificationResult ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-indigo-500/50 rounded-2xl p-6 shadow-md space-y-6"
            >
              {/* Verification Header Badge */}
              <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      TrustPass Cryptographically Verified
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {verificationResult.actionAllowed === 'check_in'
                      ? 'Equipment Handover & Check-In'
                      : 'Equipment Inspection & Return Check-Out'}
                  </h3>
                </div>

                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase border ${
                    verificationResult.actionAllowed === 'check_in'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  Stage: {verificationResult.actionAllowed === 'check_in' ? 'Check-In' : 'Return'}
                </span>
              </div>

              {/* Overdue Warning Alert */}
              {verificationResult.overdue.isOverdue && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-600 flex-shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <span className="font-bold">Overdue Return Detected:</span>
                    <p>
                      Scheduled end was {new Date(verificationResult.overdue.scheduledEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                      Equipment is currently <strong>{verificationResult.overdue.overdueMinutes} minutes past schedule</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Verified Session Summary Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Resource:</span>
                  <span className="font-semibold text-slate-800">{verificationResult.resource?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Location:</span>
                  <span className="font-semibold text-slate-800">{verificationResult.resource?.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Borrower:</span>
                  <span className="font-semibold text-slate-800">
                    {verificationResult.booking?.userName} ({verificationResult.booking?.userDepartment || 'Institutional Member'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Timeslot:</span>
                  <span className="font-semibold text-slate-800">
                    {verificationResult.booking?.date} ({verificationResult.booking?.timeSlot})
                  </span>
                </div>
              </div>

              {/* Condition Inspection Form */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>Physical Condition & Safety Inspection</span>
                </h4>

                {/* Meter Reading & Cleanliness */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Meter / Odometer / Hours Reading
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={meterReading}
                        onChange={(e) => setMeterReading(e.target.value)}
                        placeholder="e.g. 128.5 hrs or 0"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 pl-8"
                      />
                      <Gauge className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cleanliness Inspection</label>
                    <select
                      value={cleanliness}
                      onChange={(e) => setCleanliness(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="passed">Passed Cleanliness & Sanitized</option>
                      <option value="needs_cleaning">Requires Post-Op Cleaning</option>
                    </select>
                  </div>
                </div>

                {/* Operational Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operational State</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'optimal', label: 'Optimal', border: 'border-emerald-300', bg: 'hover:bg-emerald-50' },
                      { key: 'minor_wear', label: 'Minor Wear', border: 'border-blue-300', bg: 'hover:bg-blue-50' },
                      { key: 'damaged', label: 'Damaged', border: 'border-rose-300', bg: 'hover:bg-rose-50' },
                      { key: 'offline', label: 'Take Offline', border: 'border-amber-300', bg: 'hover:bg-amber-50' },
                    ].map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => setOperationalStatus(s.key as any)}
                        className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                          operationalStatus === s.key
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : `bg-white text-slate-700 border-slate-200 ${s.bg}`
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Observation Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Observations</label>
                  <textarea
                    rows={2}
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
                    placeholder="Document equipment condition, serial numbers, cable accessories..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Optional Photographic Documentation */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Optional Photographic Condition Evidence ({photosList.length} photos attached)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      placeholder="Paste image URL (e.g. https://... or uploaded image)"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      disabled={!photoUrlInput.trim()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach</span>
                    </button>
                  </div>

                  {photosList.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {photosList.map((url, i) => (
                        <div key={i} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                          <img src={url} alt="inspection" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(i)}
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-rose-300" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setVerificationResult(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteHandover}
                  disabled={submittingAction}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-2 cursor-pointer ${
                    verificationResult.actionAllowed === 'check_in'
                      ? 'bg-[#1769D2] hover:bg-[#1256B0]'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submittingAction ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      {verificationResult.actionAllowed === 'check_in' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Handover & Release Equipment</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Inspect & Finalize Return Session</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="h-full min-h-[380px] bg-white border border-[#E2E8F0] rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4">
                <QrCode className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No TrustPass Scanned</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Point your scanner at the student's digital pass or enter the token ID on the left to verify active reservations and begin inspection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckInOutPage;
