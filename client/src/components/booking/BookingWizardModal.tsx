import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Resource } from '../../types/resource';
import { preCheckBookingApi, createBookingApi, PreCheckResult } from '../../api/booking.api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Cpu,
  FileText,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface BookingWizardModalProps {
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  resource,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 2 State
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [startTimeStr, setStartTimeStr] = useState<string>('09:00');
  const [endTimeStr, setEndTimeStr] = useState<string>('12:00');

  // Step 3 State (Pre-check result)
  const [preCheckLoading, setPreCheckLoading] = useState(false);
  const [preCheckData, setPreCheckData] = useState<PreCheckResult | null>(null);

  // Step 4 State (User input fields)
  const [purpose, setPurpose] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [expectedDuration, setExpectedDuration] = useState('3 hours');
  const [additionalInformation, setAdditionalInformation] = useState('');
  const [supervisorName, setSupervisorName] = useState('Dr. Meera Raman (Faculty Advisor)');
  const [trainingAcknowledged, setTrainingAcknowledged] = useState(true);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Calculate duration
  const startHour = parseInt(startTimeStr.split(':')[0], 10) + parseInt(startTimeStr.split(':')[1], 10) / 60;
  const endHour = parseInt(endTimeStr.split(':')[0], 10) + parseInt(endTimeStr.split(':')[1], 10) / 60;
  const computedDuration = Math.max(0.5, Math.round((endHour - startHour) * 10) / 10);

  // Trigger pre-check when transitioning to step 3
  const runPreCheck = async () => {
    setPreCheckLoading(true);
    try {
      const startIso = `${selectedDate}T${startTimeStr}:00`;
      const endIso = `${selectedDate}T${endTimeStr}:00`;
      const res = await preCheckBookingApi({
        resourceId: resource._id,
        startTime: startIso,
        endTime: endIso,
        date: selectedDate,
        timeSlot: `${startTimeStr} - ${endTimeStr}`,
      });
      if (res.success) {
        setPreCheckData(res.data);
      }
    } catch (err: any) {
      console.error('Error running booking pre-check:', err);
    } finally {
      setPreCheckLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 2) {
      setCurrentStep(3);
      await runPreCheck();
    } else if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as any);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleSubmitBooking = async () => {
    setSubmitting(true);
    setSubmitError('');

    try {
      const startIso = `${selectedDate}T${startTimeStr}:00`;
      const endIso = `${selectedDate}T${endTimeStr}:00`;

      const res = await createBookingApi({
        resourceId: resource._id,
        date: selectedDate,
        timeSlot: `${startTimeStr} - ${endTimeStr}`,
        startTime: startIso,
        endTime: endIso,
        purpose,
        projectDescription,
        expectedDuration: `${computedDuration} hrs`,
        additionalInformation,
        supervisorName,
        trainingAcknowledged,
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error submitting booking reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Reserve Academic Resource</h2>
              <p className="text-xs text-slate-400">{resource.name} ({resource.category})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 5-Step Indicator */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          {[
            { num: 1, name: 'Overview' },
            { num: 2, name: 'Date & Time' },
            { num: 3, name: 'Pre-Check' },
            { num: 4, name: 'Project Details' },
            { num: 5, name: 'Confirm' },
          ].map((st) => (
            <div
              key={st.num}
              className={`flex items-center gap-2 ${
                currentStep === st.num
                  ? 'text-brand-400 font-bold'
                  : currentStep > st.num
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  currentStep === st.num
                    ? 'bg-brand-600 text-white'
                    : currentStep > st.num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {currentStep > st.num ? '✓' : st.num}
              </div>
              <span className="hidden sm:inline">{st.name}</span>
            </div>
          ))}
        </div>

        {/* Modal Body / Steps */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* STEP 1: Resource Overview */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="h-44 rounded-2xl overflow-hidden relative border border-slate-800">
                <img
                  src={
                    resource.images?.[0] ||
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop'
                  }
                  alt={resource.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    {resource.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{resource.name}</h3>
                  <p className="text-xs text-slate-300">{resource.location} • {resource.institution}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Duration Range</span>
                  <p className="font-bold text-white mt-0.5">
                    {resource.minBookingDuration || 1}h - {resource.maxBookingDuration || 8}h
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Approval Required</span>
                  <p className="font-bold text-amber-400 mt-0.5">
                    {resource.approvalRequired ? 'Yes (Custodian Review)' : 'Instant Booking'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Supervision Required</span>
                  <p className="font-bold text-purple-400 mt-0.5">
                    {resource.supervisionRequirement ? 'Supervised' : 'Self-Operated'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <p className="font-semibold text-slate-200">Prerequisites & Safety:</p>
                <p className="text-slate-400">
                  • <strong>Training:</strong> {resource.trainingRequired || 'Standard Safety Briefing'}
                </p>
                <p className="text-slate-400">
                  • <strong>Eligibility:</strong> {resource.eligibility || 'Verified institutional researchers'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Date and Time Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Reservation Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-400" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> End Time
                  </label>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Calculated Duration:</span>
                <span className="text-base font-extrabold text-brand-400">{computedDuration} Hours</span>
              </div>

              {computedDuration <= 0 && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>End time must be later than start time.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Automated Pre-Check Diagnostics */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Real-Time Institutional Reservation Verification
              </h3>

              {preCheckLoading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner message="Evaluating campus eligibility, conflict matrix, & quota limits..." size="md" />
                </div>
              ) : preCheckData ? (
                <div className="space-y-2.5 text-xs">
                  {/* Auth & User */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">User Authentication</p>
                      <p className="text-slate-400">Session verified as {preCheckData.checks.user.name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      PASS
                    </span>
                  </div>

                  {/* Eligibility */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Academic Eligibility Status</p>
                      <p className="text-slate-400">{preCheckData.checks.eligibility.detail}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      PASS
                    </span>
                  </div>

                  {/* Training */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Required Safety Certification</p>
                      <p className="text-slate-400">{preCheckData.checks.training.required}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400">
                      CLEARED
                    </span>
                  </div>

                  {/* Resource Availability */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Equipment Operational Status</p>
                      <p className="text-slate-400">{preCheckData.checks.resourceAvailability.detail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        preCheckData.checks.resourceAvailability.passed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {preCheckData.checks.resourceAvailability.passed ? 'AVAILABLE' : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Scheduling Conflict */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Temporal Collision Check</p>
                      <p className="text-slate-400">{preCheckData.checks.schedulingConflict.detail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        !preCheckData.checks.schedulingConflict.conflictDetected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {!preCheckData.checks.schedulingConflict.conflictDetected ? 'ZERO CONFLICTS' : 'COLLISION DETECTED'}
                    </span>
                  </div>

                  {/* Fair Allocation Limits */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Fair Allocation Quota Check</p>
                      <p className="text-slate-400">{preCheckData.checks.activeBookingLimits.detail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        preCheckData.checks.activeBookingLimits.passed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {preCheckData.checks.activeBookingLimits.passed ? 'WITHIN LIMITS' : 'LIMIT EXCEEDED'}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 4: Project Specifications */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purpose of Booking (Required)
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Synthesis of GaN thin-films for semiconductor capstone project"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Description & Methodology
                </label>
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Outline experiment protocol, materials brought, and safety precautions..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Faculty Sponsor / Supervisor
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Additional Requirements
                  </label>
                  <input
                    type="text"
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                    placeholder="e.g. Nitrogen purge line, cryogenic dewar"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trainingAcknowledged}
                  onChange={(e) => setTrainingAcknowledged(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-300">
                  I certify that I have read and agree to comply with laboratory safety instructions and cleanroom SOPs.
                </span>
              </label>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Review Reservation Summary</h3>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>Reservation confirmed! Redirecting to My Bookings...</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset:</span>
                  <span className="text-white font-bold">{resource.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white font-semibold">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timeslot:</span>
                  <span className="text-brand-400 font-mono font-bold">
                    {startTimeStr} - {endTimeStr} ({computedDuration} hrs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Purpose:</span>
                  <span className="text-white max-w-xs text-right truncate">{purpose || 'Capstone research'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Governance:</span>
                  <span className="text-amber-400 font-semibold">
                    {resource.approvalRequired ? 'Requires Custodian Sign-Off' : 'Instant Confirmation'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || submitting}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              disabled={
                (currentStep === 2 && computedDuration <= 0) ||
                (currentStep === 3 && preCheckData && !preCheckData.canBook) ||
                (currentStep === 4 && !purpose.trim())
              }
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitBooking}
              disabled={submitting || submitSuccess}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
            >
              {submitting && <LoadingSpinner size="sm" />}
              Submit Reservation Request
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
