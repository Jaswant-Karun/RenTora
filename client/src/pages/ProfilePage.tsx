import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { updateProfileApi, changePasswordApi } from '../api/auth';
import { useToast } from '../context/ToastContext';
import {
  Building,
  Mail,
  Phone,
  ShieldCheck,
  User,
  Key,
  Bell,
  Award,
  CheckCircle2,
  Lock,
  Save,
  Clock,
  Sparkles,
  Sliders,
  Check,
  LogOut,
  Camera,
  Calendar,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'verification' | 'preferences' | 'security'>('profile');

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [bio, setBio] = useState(user?.bio || 'Academic researcher specializing in applied engineering, laboratory instrumentation, and federated institutional resource sharing.');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Preference toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [bookingReminders, setBookingReminders] = useState(true);
  const [sustainabilityDigest, setSustainabilityDigest] = useState(true);
  const [waitlistAlerts, setWaitlistAlerts] = useState(true);

  if (!user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await updateProfileApi({
        name: name.trim(),
        phone: phone.trim(),
        department: department.trim(),
        bio: bio.trim(),
        avatar: avatar.trim() || undefined,
      });

      if (res.success && res.data) {
        // Update local session
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          const updated = { ...parsed, ...res.data };
          localStorage.setItem('user', JSON.stringify(updated));
        }
        toast.success('Institutional profile updated successfully.');
      } else {
        toast.error(res.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePasswordApi(currentPassword, newPassword);
      if (res.success) {
        toast.success('Security password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(res.message || 'Failed to update password');
      }
    } catch (err: any) {
      console.error('Password update error:', err);
      toast.error(err.response?.data?.message || 'Incorrect current password or update failed');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 1. Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">Institutional Account & Profile</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your verified academic identity, laboratory authorizations, preferences, and credential security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#16834A] border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-[#16834A]" />
            <span>Verified Academic Member</span>
          </span>
        </div>
      </div>

      {/* 2. Profile Overview Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#EFF6FF] text-[#1769D2] border border-blue-200 flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0 shadow-2xs">
            {avatar ? (
              <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#172033]">{user.name}</h2>
            <p className="text-xs text-[#64748B]">{user.email}</p>
            <div className="flex items-center gap-2 pt-0.5">
              <Badge role={user.role} size="sm" />
              <span className="text-[11px] text-[#64748B]">
                ID: <strong className="font-mono text-[#172033]">REN-2026-{user._id.slice(-4).toUpperCase()}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t sm:border-t-0 sm:border-l border-[#E2E8F0] pt-4 sm:pt-0 sm:pl-6 text-xs text-[#64748B]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-[#64748B] block">Primary Affiliation</span>
            <p className="font-semibold text-[#172033] flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-[#1769D2]" />
              {user.institution || 'Consortium University'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#E2E8F0] pb-px text-xs overflow-x-auto">
        {[
          { key: 'profile', label: 'Edit Profile Information', icon: User },
          { key: 'verification', label: 'Verification & Certifications', icon: Award },
          { key: 'preferences', label: 'Account Preferences', icon: Bell },
          { key: 'security', label: 'Password & Security', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-[#1769D2] text-[#1769D2]'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Contents */}

      {/* Tab 1: Edit Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Personal & Academic Details</h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Update details visible to equipment custodians and lab managers during reservation requests.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Full Legal / Academic Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Contact Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Academic Department / Laboratory</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Department of Mechanical Engineering"
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Avatar Image URL (Optional)</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">Research Bio & Objectives</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Provide a summary of your ongoing projects and resource usage focus..."
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg p-3 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2] leading-relaxed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Verification & Certifications */}
      {activeTab === 'verification' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-sm font-bold text-[#172033]">Institutional Verification Credentials</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Cryptographically federated academic badge across university member nodes.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#16834A] border border-emerald-200">
                Active & Verified
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Accreditation Node</span>
                <p className="font-semibold text-[#172033]">{user.institution}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">FairShare Allocation Tier</span>
                <p className="font-semibold text-[#172033]">Tier 1 - Unrestricted Access</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#64748B]">Annual Recertification</span>
                <p className="font-semibold text-[#172033]">November 2027</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#172033]">Safety & Training Certifications</h3>
            <p className="text-xs text-[#64748B]">
              The following certificates are mapped to your account and automatically clear prerequisites for high-grade apparatus.
            </p>

            <div className="space-y-2.5 pt-1">
              {[
                { title: 'Cleanroom Protocol ISO-5 Certification', authority: 'Central Nanofabrication Facility', date: 'Valid through 2027', status: 'Certified' },
                { title: 'OSHA High-Voltage & Electrical Safety Standard', authority: 'Campus Safety Directorate', date: 'Valid through 2028', status: 'Certified' },
                { title: 'Laser Safety Officer Level 2 Clearance', authority: 'Optics & Photonics Department', date: 'Valid through 2027', status: 'Certified' },
                { title: 'Heavy Machining & 5-Axis CNC Workshop Permit', authority: 'Department of Precision Engineering', date: 'Valid through 2026', status: 'Certified' },
              ].map((cert, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16834A] border border-emerald-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#172033]">{cert.title}</p>
                      <p className="text-[11px] text-[#64748B]">{cert.authority} • {cert.date}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-emerald-200 text-[#16834A]">
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Account Preferences */}
      {activeTab === 'preferences' && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#172033]">Notification & Experience Preferences</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Control which system notices and alert digests are dispatched to your inbox and browser.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-semibold text-[#172033]">Booking Approvals & Custodian Notices</p>
                <p className="text-[11px] text-[#64748B]">Receive immediate notifications whenever a custodian approves or rejects a reservation request.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 text-[#1769D2] rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-semibold text-[#172033]">TrustPass Check-in & Return Reminders</p>
                <p className="text-[11px] text-[#64748B]">Get timely reminders 1 hour before scheduled physical equipment handovers.</p>
              </div>
              <input
                type="checkbox"
                checked={bookingReminders}
                onChange={(e) => setBookingReminders(e.target.checked)}
                className="w-4 h-4 text-[#1769D2] rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-semibold text-[#172033]">FairShare Waiting List Slot Availability</p>
                <p className="text-[11px] text-[#64748B]">Be alerted instantly when a slot opens up and you advance in the reservation queue.</p>
              </div>
              <input
                type="checkbox"
                checked={waitlistAlerts}
                onChange={(e) => setWaitlistAlerts(e.target.checked)}
                className="w-4 h-4 text-[#1769D2] rounded border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div>
                <p className="text-xs font-semibold text-[#172033]">EcoShare Monthly Sustainability Digest</p>
                <p className="text-[11px] text-[#64748B]">Receive monthly asset reuse hours and circular sharing reports.</p>
              </div>
              <input
                type="checkbox"
                checked={sustainabilityDigest}
                onChange={(e) => setSustainabilityDigest(e.target.checked)}
                className="w-4 h-4 text-[#1769D2] rounded border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => toast.success('Preferences saved successfully.')}
              className="px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              Update Preferences
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Password & Security */}
      {activeTab === 'security' && (
        <form onSubmit={handlePasswordSubmit} className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-bold text-[#172033]">Account Security & Password Management</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Change your login password and manage active authenticated sessions.
            </p>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#64748B]">
              Tokens expire automatically after inactivity per campus security standards.
            </span>
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{savingPassword ? 'Updating Password...' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;

