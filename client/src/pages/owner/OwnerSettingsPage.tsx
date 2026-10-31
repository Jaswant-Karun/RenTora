import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Bell,
  CheckCircle2,
  Sliders,
  Mail,
  Smartphone,
} from 'lucide-react';

export const OwnerSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bufferTime, setBufferTime] = useState('15');
  const [requireHandoverScan, setRequireHandoverScan] = useState(true);
  const [autoApproveVerified, setAutoApproveVerified] = useState(false);
  const [allowWeekendBookings, setAllowWeekendBookings] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [incidentEscalation, setIncidentEscalation] = useState(true);
  const [operatingHoursStart, setOperatingHoursStart] = useState('08:00');
  const [operatingHoursEnd, setOperatingHoursEnd] = useState('20:00');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-[#1769D2]" />
          Custodian Console Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-1">
          Configure laboratory handover guidelines, automated booking filters, and telemetry notifications.
        </p>
      </div>

      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-[#16834A] text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Custodian parameters and reservation rules saved successfully.
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Lab Handover & Turnaround Policies */}
        <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
            <Sliders className="w-5 h-5 text-[#1769D2]" />
            <h2 className="text-base font-bold text-[#172033]">Turnaround & Handover Protocol</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Post-Session Buffer / Cooldown Time (Minutes)
              </label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="0">0 minutes (Immediate handover)</option>
                <option value="15">15 minutes (Standard wipe down / recalibrate)</option>
                <option value="30">30 minutes (Thorough thermal cooldown)</option>
                <option value="60">60 minutes (Deep sanitization & cycle reset)</option>
              </select>
              <p className="text-[11px] text-[#64748B] mt-1">
                Automatically blocks slots following a session to avoid equipment over-stress.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#172033]">Handover Validation Mode</label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireHandoverScan}
                  onChange={(e) => setRequireHandoverScan(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                />
                <span className="text-xs text-[#172033]">Enforce physical ID verification on check-in</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveVerified}
                  onChange={(e) => setAutoApproveVerified(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                />
                <span className="text-xs text-[#172033]">Auto-approve repeat faculty researchers</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowWeekendBookings}
                  onChange={(e) => setAllowWeekendBookings(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                />
                <span className="text-xs text-[#172033]">Allow weekend research reservations</span>
              </label>
            </div>
          </div>
        </div>

        {/* Operating Window */}
        <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#172033] pb-3 border-b border-[#E2E8F0]">
            Facility Operating Window
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Opens At</label>
              <input
                type="time"
                value={operatingHoursStart}
                onChange={(e) => setOperatingHoursStart(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Closes At</label>
              <input
                type="time"
                value={operatingHoursEnd}
                onChange={(e) => setOperatingHoursEnd(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
              />
            </div>
          </div>
        </div>

        {/* Communication & Alerts */}
        <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
            <Bell className="w-5 h-5 text-[#1769D2]" />
            <h2 className="text-base font-bold text-[#172033]">Alerts & Notifications</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
              <span className="flex items-center gap-2 text-xs text-[#172033]">
                <Mail className="w-4 h-4 text-[#1769D2]" /> Email Alerts for Incoming Booking Requests
              </span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
              <span className="flex items-center gap-2 text-xs text-[#172033]">
                <Smartphone className="w-4 h-4 text-[#1769D2]" /> SMS Overstay & Late Handover Warning
              </span>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
              <span className="flex items-center gap-2 text-xs text-[#172033]">
                <Bell className="w-4 h-4 text-[#D97706]" /> Auto-escalate Safety Breaches to Campus Safety Officer
              </span>
              <input
                type="checkbox"
                checked={incidentEscalation}
                onChange={(e) => setIncidentEscalation(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-sm transition-all"
          >
            Save Custodian Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default OwnerSettingsPage;
