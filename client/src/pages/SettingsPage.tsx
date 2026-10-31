import React, { useState } from 'react';
import { Settings, Shield, Bell, Check } from 'lucide-react';
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
        <h1 className="text-xl font-bold text-[#172033] tracking-tight">Account Settings & Preferences</h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          Manage your notification alerts, security preferences, and active credentials.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
        {/* Notification Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#1769D2]" />
            Notification Preferences
          </h2>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <span className="font-medium text-[#172033] block">Email Reservation Confirmations</span>
                <span className="text-[#64748B] text-[11px]">Receive pass confirmations and custodian decisions via institutional email</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer hover:bg-slate-100 transition-colors">
              <div>
                <span className="font-medium text-[#172033] block">SMS Urgent Maintenance Alerts</span>
                <span className="text-[#64748B] text-[11px]">Receive SMS notices if equipment experiences emergency downtime</span>
              </div>
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
              />
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
          <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#16834A]" />
            Institutional Security & Session
          </h2>
          <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
            <p className="font-medium text-[#172033]">JWT Encrypted Session with httpOnly Cookie Storage</p>
            <p className="text-[11px] text-[#64748B]">
              Your session is cryptographically signed and protected with sameSite cookie policies against CSRF vectors.
            </p>
          </div>
        </div>

        {/* Save Controls */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2E8F0]">
          {saved && (
            <span className="text-xs text-[#16834A] flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" /> Preferences saved!
            </span>
          )}
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
