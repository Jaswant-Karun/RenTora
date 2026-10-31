import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import {
  LayoutDashboard,
  Compass,
  CalendarCheck,
  Clock,
  Activity,
  Bell,
  User,
  Settings,
  Cpu,
  PlusCircle,
  Inbox,
  CheckCircle2,
  QrCode,
  ClipboardCheck,
  AlertTriangle,
  Calendar,
  BarChart3,
  History,
  Building2,
  Scale,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  const role = user.role;
  const isOwnerPath = location.pathname.startsWith('/owner');
  const isManagerPath = location.pathname.startsWith('/manager');
  const isAdminPath = location.pathname.startsWith('/admin');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 12 Owner modules
  const ownerNavItems = [
    { label: 'Overview', to: '/owner', icon: LayoutDashboard },
    { label: 'My Resources', to: '/owner/resources', icon: Cpu },
    { label: 'Add Resource', to: '/owner/add-resource', icon: PlusCircle },
    { label: 'Booking Requests', to: '/owner/requests', icon: Inbox },
    { label: 'Approved Bookings', to: '/owner/approved', icon: CheckCircle2 },
    { label: 'Check-in / Check-out', to: '/owner/checkin', icon: QrCode },
    { label: 'Condition Reports', to: '/owner/condition-reports', icon: ClipboardCheck },
    { label: 'Incidents', to: '/owner/incidents', icon: AlertTriangle },
    { label: 'Availability Calendar', to: '/owner/calendar', icon: Calendar },
    { label: 'Analytics', to: '/owner/analytics', icon: BarChart3 },
    { label: 'Audit History', to: '/owner/audit', icon: History },
    { label: 'Settings', to: '/owner/settings', icon: Settings },
  ];

  // Admin modules
  const adminNavItems = [
    { label: 'Platform Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'User Management', to: '/admin', icon: Users },
    { label: 'Resource Governance', to: '/admin', icon: Cpu },
    { label: 'Institutions', to: '/admin', icon: Building2 },
    { label: 'Audit Ledger', to: '/admin', icon: History },
    { label: 'System Settings', to: '/admin', icon: Settings },
  ];

  // Manager modules
  const managerNavItems = [
    { label: 'Manager Overview', to: '/manager', icon: Building2 },
    { label: 'Resource Approvals', to: '/manager/approvals', icon: ClipboardCheck },
    { label: 'User Verification', to: '/manager/users', icon: Users },
    { label: 'Conflict Resolution', to: '/manager/conflicts', icon: AlertTriangle },
    { label: 'Dispute Arbitration', to: '/manager/disputes', icon: Scale },
    { label: 'Fair Allocation Settings', to: '/manager/fair-allocation', icon: Settings },
  ];

  // Borrower / Student modules
  const userNavItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Explore Resources', to: '/dashboard/explore', icon: Compass },
    { label: 'My Bookings', to: '/dashboard/bookings', icon: CalendarCheck },
    { label: 'Waiting List', to: '/dashboard/waitlist', icon: Clock },
    { label: 'My Activity', to: '/dashboard/activity', icon: Activity },
    { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
    { label: 'Profile', to: '/dashboard/profile', icon: User },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  let navItems = userNavItems;
  let sectionTitle = 'MAIN NAVIGATION';

  if (role === 'admin' || isAdminPath) {
    navItems = adminNavItems;
    sectionTitle = 'ADMINISTRATION';
  } else if (role === 'owner' || isOwnerPath) {
    navItems = ownerNavItems;
    sectionTitle = 'CUSTODIAN MODULES';
  } else if (role === 'manager' && isManagerPath) {
    navItems = managerNavItems;
    sectionTitle = 'CAMPUS GOVERNANCE';
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-[#172033] justify-between">
      {/* Top Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0]">
          <NavLink
            to="/dashboard"
            onClick={onMobileClose}
            className="flex items-center space-x-2.5 overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1769D2] flex items-center justify-center text-white shrink-0 shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="leading-none">
                <span className="font-bold text-base tracking-tight text-[#172033]">RENTORA</span>
                <span className="block text-[10px] text-[#64748B] font-medium tracking-wide">ENTERPRISE</span>
              </div>
            )}
          </NavLink>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded-md text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* View Switcher if Multi-Role User */}
        {(role === 'owner' || role === 'manager' || role === 'admin') && !isCollapsed && (
          <div className="p-3 border-b border-[#E2E8F0]">
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-medium">
              <NavLink
                to="/dashboard"
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `py-1 px-2 rounded-md text-center transition-colors ${
                    !isOwnerPath && !isManagerPath && !isAdminPath
                      ? 'bg-white text-[#1769D2] shadow-sm font-semibold'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`
                }
              >
                Borrower
              </NavLink>
              <NavLink
                to={role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/manager'}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `py-1 px-2 rounded-md text-center transition-colors ${
                    isOwnerPath || isManagerPath || isAdminPath
                      ? 'bg-[#1769D2] text-white shadow-sm font-semibold'
                      : 'text-[#64748B] hover:text-[#172033]'
                  }`
                }
              >
                {role === 'admin' ? 'Admin Hub' : role === 'owner' ? 'Custodian' : 'Manager'}
              </NavLink>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <div className="p-3">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-[#64748B] uppercase">
              {sectionTitle}
            </p>
          )}

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/owner' || item.to === '/dashboard' || item.to === '/manager' || item.to === '/admin'}
                  onClick={onMobileClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#1769D2] font-semibold border-r-2 border-[#1769D2]'
                        : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#172033]'
                    }`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-colors`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Section at Bottom */}
      <div className="p-3 border-t border-[#E2E8F0] space-y-2">
        {!isCollapsed ? (
          <>
            <div className="flex items-center space-x-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center font-semibold text-xs shrink-0 border border-blue-200">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#172033] truncate">{user.name}</p>
                <p className="text-[10px] text-[#64748B] truncate">{user.institution}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center font-semibold text-xs border border-blue-200" title={user.name}>
              {user.name.charAt(0)}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-[#E2E8F0] bg-white transition-all duration-200 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-xs bg-white h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
