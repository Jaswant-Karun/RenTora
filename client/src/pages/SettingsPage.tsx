import React, { useState } from 'react';
import { Settings, Shield, Bell, Lock, Check } from 'lucide-react';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white">Account Settings & Security</h1>
        <p className="text-xs text-slate-400">
          Manage your notification preferences, institutional security policies, and session credentials.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand-400" />
            Notification Preferences
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-white block">Email Reservation Alerts</span>
                <span className="text-slate-400 text-[11px]">Receive pass confirmations and clearance notifications via email</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-white block">SMS Emergency Maintenance Alerts</span>
                <span className="text-slate-400 text-[11px]">Receive SMS messages if equipment experiences unexpected downtime</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 bg-slate-900 border-slate-700"
              />
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Active Session Security
          </h3>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
            <p className="font-semibold text-slate-200">JWT Token with httpOnly Cookie Storage</p>
            <p className="text-[11px] text-slate-400">
              Your session is secured using modern cryptographic signatures with sameSite policy protection against CSRF attacks.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          )}
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
