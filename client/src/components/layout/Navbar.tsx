import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { getNotificationsApi, markNotificationReadApi } from '../../api/resource.api';
import { NotificationItem } from '../../types/resource';
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
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout, demoAccounts, switchDemoRole } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch real notifications for the user
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await getNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.slice(0, 6));
        setUnreadCount(res.data.filter((n: NotificationItem) => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to load notifications in Navbar:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

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

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'approval':
      case 'booking_confirmed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#16834A]" />;
      case 'rejection':
      case 'overdue_alert':
        return <AlertCircle className="w-3.5 h-3.5 text-[#DC2626]" />;
      case 'waitlist_update':
        return <Clock className="w-3.5 h-3.5 text-[#D97706]" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-[#1769D2]" />;
    }
  };

  return (
    <>
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

          {/* Global Search Bar (Trigger Search Modal) */}
          <div
            onClick={() => setIsSearchModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsSearchModalOpen(true);
              }
            }}
            className="relative w-full max-w-md hidden sm:flex items-center cursor-pointer bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] hover:bg-slate-100 rounded-lg pl-9 pr-3 py-2 border border-[#E2E8F0] transition-all group"
            title="Search resources, bookings, and incident records (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#64748B] group-hover:text-[#1769D2] absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
            <span className="text-xs truncate">Quick search resources, reservations, incidents...</span>
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#64748B] bg-white rounded border border-[#E2E8F0] shadow-2xs">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Mobile search button */}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="sm:hidden p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
            title="Search (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Live Backend Status Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-[#16834A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-pulse" />
            <span>Backend: Online</span>
          </div>

          {/* Help Center Link */}
          <Link
            to="/dashboard/help"
            className="p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors flex items-center justify-center"
            title="Help Center & User Guides"
            aria-label="Help Center"
          >
            <HelpCircle className="w-4 h-4" />
          </Link>

          {/* Notifications Icon & Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative p-2 text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              title="Notifications"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#1769D2] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#E2E8F0] shadow-xl p-3 z-50 text-[#172033]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#172033]">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <Link
                    to="/dashboard/notifications"
                    onClick={() => setNotificationOpen(false)}
                    className="text-[11px] font-medium text-[#1769D2] hover:underline"
                  >
                    View all history →
                  </Link>
                </div>

                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#64748B] space-y-1">
                    <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="font-medium text-[#172033]">All caught up!</p>
                    <p className="text-[11px]">No notifications right now.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => {
                          setNotificationOpen(false);
                          navigate('/dashboard/notifications');
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-2.5 ${
                          notif.isRead
                            ? 'bg-white border-[#E2E8F0] hover:bg-slate-50'
                            : 'bg-[#EFF6FF]/60 border-blue-200 hover:bg-[#EFF6FF]'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5">
                          {getNotifIcon(notif.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#172033] truncate">{notif.title}</p>
                          <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(notif._id, e)}
                            className="text-[10px] text-[#1769D2] hover:underline shrink-0 p-1 font-medium"
                            title="Mark as read"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
                aria-label="User account menu"
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
                      to="/dashboard/help"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-xs text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] rounded-lg transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Help & Support</span>
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
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

export default Navbar;

