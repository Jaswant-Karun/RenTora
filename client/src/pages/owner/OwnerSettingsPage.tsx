import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Settings,
  Shield,
  Bell,
  Clock,
  CheckCircle2,
  Lock,
  Save,
  Sliders,
  Building,
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-brand-400" />
          Custodian Console Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure laboratory handover guidelines, automated booking filters, and telemetry notifications.
        </p>
      </div>

      {savedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Custodian parameters and reservation rules saved successfully.
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Lab Handover & Turnaround Policies */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-brand-400" />
            <h2 className="text-base font-bold text-white">Turnaround & Handover Protocol</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Post-Session Buffer / Cooldown Time (Minutes)
              </label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="0">0 minutes (Immediate handover)</option>
                <option value="15">15 minutes (Standard wipe down / recalibrate)</option>
                <option value="30">30 minutes (Thorough thermal cooldown)</option>
                <option value="60">60 minutes (Deep sanitization & cycle reset)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Automatically blocks slots following a session to avoid equipment over-stress.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Handover Validation Mode</label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireHandoverScan}
                  onChange={(e) => setRequireHandoverScan(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-300">Enforce physical ID verification on check-in</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApproveVerified}
                  onChange={(e) => setAutoApproveVerified(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-300">
                  Auto-approve verified institutional faculty for standard equipment
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Operating Window */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Facility Operating Schedule</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Opening Time</label>
              <input
                type="time"
                value={operatingHoursStart}
                onChange={(e) => setOperatingHoursStart(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Closing Time</label>
              <input
                type="time"
                value={operatingHoursEnd}
                onChange={(e) => setOperatingHoursEnd(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowWeekendBookings}
                  onChange={(e) => setAllowWeekendBookings(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-300">Allow weekend research bookings</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications & Alert Dispatch */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Alert Dispatch & Notifications</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Immediate Email on Booking Request</p>
                  <p className="text-[11px] text-slate-500">Receive requester credentials and rationale</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Critical Incident SMS Ping</p>
                  <p className="text-[11px] text-slate-500">Direct alert on equipment E-stop or safety hazard</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-rose-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Automatic EH&S Escalation</p>
                  <p className="text-[11px] text-slate-500">Route High/Critical incidents to Institutional Manager</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={incidentEscalation}
                onChange={(e) => setIncidentEscalation(e.target.checked)}
                className="rounded border-slate-700 text-brand-600 focus:ring-brand-500"
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-brand-500/20 text-sm transition-all"
          >
            <Save className="w-4 h-4" />
            Save Custodian Settings
          </button>
        </div>
      </form>
    </div>
  );
};
