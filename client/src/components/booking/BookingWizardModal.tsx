import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Resource } from '../../types/resource';
import { preCheckBookingApi, createBookingApi, PreCheckResult } from '../../api/booking.api';
import { detectSchedulingConflictsApi, ConflictDetectionResponse } from '../../api/ai.api';
import { SchedulingConflictAlert } from '../ai/SchedulingConflictAlert';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  X,
  Building,
  MapPin,
  CheckCircle2,
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

  // AI Conflict Detection State
  const [aiConflictData, setAiConflictData] = useState<ConflictDetectionResponse | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Step 3 State (Pre-check result)
  const [preCheckLoading, setPreCheckLoading] = useState(false);
  const [preCheckData, setPreCheckData] = useState<PreCheckResult | null>(null);

  // AI Conflict Scanning
  const checkAiConflicts = async (dateVal = selectedDate, startVal = startTimeStr, endVal = endTimeStr) => {
    setCheckingConflict(true);
    try {
      const startIso = `${dateVal}T${startVal}:00`;
      const endIso = `${dateVal}T${endVal}:00`;
      const res = await detectSchedulingConflictsApi({
        resourceId: resource._id,
        startTime: startIso,
        endTime: endIso,
        date: dateVal,
        timeSlot: `${startVal} - ${endVal}`,
      });
      if (res.success) {
        setAiConflictData(res.data);
      }
    } catch (err) {
      console.error('Error scanning AI conflicts:', err);
    } finally {
      setCheckingConflict(false);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && selectedDate && startTimeStr && endTimeStr) {
      const timer = setTimeout(() => {
        checkAiConflicts(selectedDate, startTimeStr, endTimeStr);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentStep, selectedDate, startTimeStr, endTimeStr]);

  // Step 4 State (User input fields)
  const [purpose, setPurpose] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
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
        }, 1500);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error submitting booking reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="w-full max-w-2xl rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center border border-[#1769D2]/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#172033]">Reserve Institutional Resource</h2>
              <p className="text-xs text-[#64748B]">{resource.name} • {resource.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5-Step Indicator */}
        <div className="px-5 sm:px-6 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
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
                  ? 'text-[#1769D2] font-semibold'
                  : currentStep > st.num
                  ? 'text-[#16834A] font-medium'
                  : 'text-[#64748B]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  currentStep === st.num
                    ? 'bg-[#1769D2] text-white shadow-sm'
                    : currentStep > st.num
                    ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                    : 'bg-slate-200 text-[#64748B]'
                }`}
              >
                {currentStep > st.num ? '✓' : st.num}
              </div>
              <span className="hidden sm:inline">{st.name}</span>
            </div>
          ))}
        </div>

        {/* Modal Body / Steps */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5 bg-[#FFFFFF]">
          {/* STEP 1: Resource Overview */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="h-44 rounded-xl overflow-hidden relative border border-[#E2E8F0]">
                <img
                  src={
                    resource.images?.[0] ||
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop'
                  }
                  alt={resource.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#172033]/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/30">
                    {resource.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{resource.name}</h3>
                  <p className="text-xs text-slate-200">{resource.location} • {resource.institution}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Duration Range</span>
                  <p className="font-semibold text-[#172033] mt-0.5">
                    {resource.minBookingDuration || 1}h - {resource.maxBookingDuration || 8}h
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Approval Required</span>
                  <p className="font-semibold text-[#D97706] mt-0.5">
                    {resource.approvalRequired ? 'Yes (Custodian Review)' : 'Instant Booking'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Supervision</span>
                  <p className="font-semibold text-[#1769D2] mt-0.5">
                    {resource.supervisionRequirement ? 'Supervised' : 'Self-Operated'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1.5">
                <p className="font-semibold text-[#172033]">Prerequisites & Safety Requirements:</p>
                <p className="text-[#64748B]">
                  • <strong>Training:</strong> {resource.trainingRequired || 'Standard Safety Briefing'}
                </p>
                <p className="text-[#64748B]">
                  • <strong>Eligibility:</strong> {resource.eligibility || 'Verified institutional researchers'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Date and Time Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Select Reservation Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1769D2]" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1769D2]" /> End Time
                  </label>
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Total Calculated Duration:</span>
                <span className="text-sm font-bold text-[#1769D2]">{computedDuration} Hours</span>
              </div>

              {computedDuration <= 0 && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>End time must be later than start time.</span>
                </div>
              )}

              {/* AI Scheduling Conflict Detection Alert */}
              <SchedulingConflictAlert
                conflictData={aiConflictData}
                loading={checkingConflict}
                onSelectAlternativeSlot={(slot) => {
                  setSelectedDate(slot.date);
                  const parts = slot.timeSlot.split('-').map((s) => s.trim());
                  if (parts[0]) setStartTimeStr(parts[0]);
                  if (parts[1]) setEndTimeStr(parts[1]);
                }}
                onProceedToWaitlist={() => {
                  setCurrentStep(4);
                }}
              />
            </div>
          )}

          {/* STEP 3: Automated Pre-Check Diagnostics */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1769D2]" />
                Institutional Eligibility & Conflict Verification
              </h3>

              {preCheckLoading ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner message="Evaluating campus eligibility, conflict matrix, & quota limits..." size="md" />
                </div>
              ) : preCheckData ? (
                <div className="space-y-2.5 text-xs">
                  {/* Auth & User */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#172033]">User Authentication</p>
                      <p className="text-[#64748B]">Session verified as {preCheckData.checks.user.name}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16834A] border border-emerald-200">
                      PASS
                    </span>
                  </div>

                  {/* Eligibility */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#172033]">Academic Eligibility Status</p>
                      <p className="text-[#64748B]">{preCheckData.checks.eligibility.detail}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-[#16834A] border border-emerald-200">
                      PASS
                    </span>
                  </div>

                  {/* Training */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#172033]">Required Safety Certification</p>
                      <p className="text-[#64748B]">{preCheckData.checks.training.required}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                      CLEARED
                    </span>
                  </div>

                  {/* Resource Availability */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#172033]">Equipment Operational Status</p>
                      <p className="text-[#64748B]">{preCheckData.checks.resourceAvailability.detail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        preCheckData.checks.resourceAvailability.passed
                          ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                          : 'bg-red-50 text-[#DC2626] border border-red-200'
                      }`}
                    >
                      {preCheckData.checks.resourceAvailability.passed ? 'AVAILABLE' : 'OFFLINE'}
                    </span>
                  </div>

                  {/* Scheduling Conflict */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#172033]">Temporal Collision Check</p>
                      <p className="text-[#64748B]">{preCheckData.checks.schedulingConflict.detail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        !preCheckData.checks.schedulingConflict.conflictDetected
                          ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                          : 'bg-red-50 text-[#DC2626] border border-red-200'
                      }`}
                    >
                      {!preCheckData.checks.schedulingConflict.conflictDetected ? 'ZERO CONFLICTS' : 'COLLISION DETECTED'}
                    </span>
                  </div>

                  {/* Fair Allocation Limits */}
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#172033]">Fair Allocation Quota Check</p>
                      <p className="text-[#64748B]">{preCheckData.checks.activeBookingLimits.detail}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        preCheckData.checks.activeBookingLimits.passed
                          ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                          : 'bg-red-50 text-[#DC2626] border border-red-200'
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
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Purpose of Booking (Required)
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Synthesis of GaN thin-films for semiconductor capstone project"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Project Description & Methodology
                </label>
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Outline experiment protocol, materials brought, and safety precautions..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Faculty Sponsor / Supervisor
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Additional Requirements
                  </label>
                  <input
                    type="text"
                    value={additionalInformation}
                    onChange={(e) => setAdditionalInformation(e.target.value)}
                    placeholder="e.g. Nitrogen purge line, cryogenic dewar"
                    className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={trainingAcknowledged}
                  onChange={(e) => setTrainingAcknowledged(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                />
                <span className="text-xs text-[#64748B]">
                  I certify that I have read and agree to comply with laboratory safety instructions and facility SOPs.
                </span>
              </label>
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#172033]">Review Reservation Summary</h3>

              {submitError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16834A] text-sm flex items-center gap-2">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>Reservation confirmed! Redirecting to My Bookings...</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Asset:</span>
                  <span className="text-[#172033] font-bold">{resource.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Date:</span>
                  <span className="text-[#172033] font-medium">{selectedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Timeslot:</span>
                  <span className="text-[#1769D2] font-semibold">
                    {startTimeStr} - {endTimeStr} ({computedDuration} hrs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Purpose:</span>
                  <span className="text-[#172033] max-w-xs text-right truncate">{purpose || 'Capstone research'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Governance:</span>
                  <span className="text-[#D97706] font-medium">
                    {resource.approvalRequired ? 'Requires Custodian Sign-Off' : 'Instant Confirmation'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#E2E8F0] flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || submitting}
            className="px-4 py-2 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-50 disabled:opacity-40 text-[#172033] text-xs font-medium transition-colors flex items-center gap-1.5"
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
              className="px-5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitBooking}
              disabled={submitting || submitSuccess}
              className="px-5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
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
