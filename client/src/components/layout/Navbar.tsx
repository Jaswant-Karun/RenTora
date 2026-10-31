import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import {
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Settings,
  Sparkles,
  ChevronDown,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout, demoAccounts, switchDemoRole } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/dashboard/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile trigger & Global Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-xl">
        {user && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-[#64748B] hover:text-[#172033] hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources, labs, instruments..."
            className="w-full bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] text-xs rounded-lg pl-9 pr-4 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2] transition-colors"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Live Backend Status Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-[#16834A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-pulse" />
          <span>Backend: Online</span>
        </div>
        {/* Help Option */}
        <button
          type="button"
          onClick={() => setHelpModalOpen(true)}
          className="p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
          title="Platform documentation and support"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1769D2]" />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#E2E8F0] shadow-lg p-3 z-50 text-[#172033]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                <span className="text-xs font-semibold text-[#172033]">Recent Notifications</span>
                <Link
                  to="/dashboard/notifications"
                  onClick={() => setNotificationOpen(false)}
                  className="text-[11px] text-[#1769D2] hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-lg bg-[#EFF6FF] border border-blue-100">
                  <p className="font-medium text-[#172033]">Session Active</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">Your institutional account is verified and ready for asset bookings.</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="font-medium text-[#172033]">Fair Allocation Policy Active</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">3 active reservations allowed concurrently per researcher.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Demo Roles Quick Switcher for Evaluation */}
        <div className="hidden md:flex items-center space-x-1 pl-1 border-l border-[#E2E8F0]">
          <span className="text-[11px] font-medium text-[#64748B] px-1.5">Demo:</span>
          {demoAccounts.map((acc) => (
            <button
              key={acc.role}
              onClick={async () => {
                await switchDemoRole(acc.role);
                navigate(acc.role === 'admin' ? '/admin' : acc.role === 'manager' ? '/manager' : acc.role === 'owner' ? '/owner' : '/dashboard');
              }}
              className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
                user?.role === acc.role
                  ? 'bg-[#1769D2] text-white shadow-xs font-semibold'
                  : 'bg-[#F8FAFC] hover:bg-slate-200 text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
              title={`Switch persona to ${acc.roleLabel}`}
            >
              {acc.role.charAt(0).toUpperCase() + acc.role.slice(1)}
            </button>
          ))}
        </div>

        {/* User Profile Avatar & Dropdown */}
        {user ? (
          <div className="relative pl-1" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center font-semibold text-xs border border-blue-200">
                {user.name.charAt(0)}
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <span className="font-medium text-[#172033] block truncate max-w-[120px]">{user.name}</span>
                <span className="text-[10px] text-[#64748B] block capitalize">{user.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E2E8F0] shadow-lg p-2 z-50 text-[#172033]">
                <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                  <p className="text-xs font-semibold text-[#172033] truncate">{user.name}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                  <div className="mt-1">
                    <Badge role={user.role} size="sm" />
                  </div>
                </div>

                <div className="space-y-0.5">
                  {user.role === 'owner' && (
                    <Link
                      to="/owner"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-xs text-[#1769D2] hover:bg-[#EFF6FF] rounded-lg transition-colors font-medium"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Custodian Console</span>
                    </Link>
                  )}
                  {user.role === 'manager' && (
                    <Link
                      to="/manager"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-xs text-[#1769D2] hover:bg-[#EFF6FF] rounded-lg transition-colors font-medium"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Manager Governance</span>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-xs text-[#1769D2] hover:bg-[#EFF6FF] rounded-lg transition-colors font-medium"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Admin Control Center</span>
                    </Link>
                  )}
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Account Settings</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link
              to="/login"
              className="px-3.5 py-1.5 text-xs font-medium text-[#1769D2] hover:bg-[#EFF6FF] rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-medium bg-[#1769D2] hover:bg-[#1256B0] text-white rounded-lg shadow-sm transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>

      {/* Help & Support Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#172033]">RENTORA Help & Documentation</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Smart Institutional Resource Sharing</p>
              </div>
              <button
                onClick={() => setHelpModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#172033] rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#64748B]">
              <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="font-semibold text-[#172033]">Team Storm Breakerz</p>
                <p className="mt-0.5">Team Leader: Jaswant Karun S A</p>
              </div>
              <p>
                RENTORA enables accredited universities to federate scientific equipment, testing rigs, and labs.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Browse catalog or use AI Matcher to find apparatus.</li>
                <li>Submit booking request with required safety clearances.</li>
                <li>Check-in on handover and record return condition.</li>
              </ul>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setHelpModalOpen(false)}
                className="px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
