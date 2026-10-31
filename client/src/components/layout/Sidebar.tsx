import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  Scale,
  Users,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  const isOwnerPath = location.pathname.startsWith('/owner');
  const isManagerPath = location.pathname.startsWith('/manager');
  const isAdminPath = location.pathname.startsWith('/admin');

  // Exact 12 Owner items requested
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

  // Admin items
  const adminNavItems = [
    { label: 'Platform Overview', to: '/admin', icon: LayoutDashboard },
    { label: 'User Management', to: '/admin', icon: Users },
    { label: 'Resource Governance', to: '/admin', icon: Cpu },
    { label: 'Institutions', to: '/admin', icon: Building2 },
    { label: 'Audit Ledger', to: '/admin', icon: History },
    { label: 'System Settings', to: '/admin', icon: Settings },
  ];

  // Manager items
  const managerNavItems = [
    { label: 'Manager Overview', to: '/manager', icon: Building2 },
    { label: 'Resource Approvals', to: '/manager/approvals', icon: ClipboardCheck },
    { label: 'User Verification', to: '/manager/users', icon: Users },
    { label: 'Conflict Resolution', to: '/manager/conflicts', icon: AlertTriangle },
    { label: 'Dispute Arbitration', to: '/manager/disputes', icon: Scale },
    { label: 'Fair Allocation Settings', to: '/manager/fair-allocation', icon: Settings },
  ];

  // Primary user / borrower items
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

  // Decide which navigation set to display
  let navItems = userNavItems;
  let sectionTitle = 'Main Workspace';

  if (role === 'admin' || isAdminPath) {
    navItems = adminNavItems;
    sectionTitle = 'System Admin Console';
  } else if (role === 'owner' || isOwnerPath) {
    navItems = ownerNavItems;
    sectionTitle = 'Owner Custodian Console';
  } else if (role === 'manager' && isManagerPath) {
    navItems = managerNavItems;
    sectionTitle = 'Institutional Governance';
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md min-h-[calc(100vh-4rem)] p-4">
      <div>
        {/* User Card */}
        <div className="p-3 mb-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center space-x-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md shadow-brand-500/20">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Badge role={user.role} size="sm" />
            </div>
          </div>
        </div>

        {/* Quick Role Switcher Buttons if Owner or Manager */}
        {(role === 'owner' || role === 'manager' || role === 'admin') && (
          <div className="mb-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-bold">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `p-1.5 rounded-lg text-center transition-colors ${
                  !isOwnerPath && !isManagerPath && !isAdminPath
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              Borrower View
            </NavLink>
            <NavLink
              to={role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/manager'}
              className={({ isActive }) =>
                `p-1.5 rounded-lg text-center transition-colors ${
                  isOwnerPath || isManagerPath || isAdminPath
                    ? 'bg-brand-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {role === 'admin' ? 'Admin Hub' : role === 'owner' ? 'Owner Console' : 'Manager Hub'}
            </NavLink>
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
            <span>{sectionTitle}</span>
            {role === 'owner' && <span className="text-brand-400 font-mono">12 modules</span>}
          </p>
          <div className="max-h-[calc(100vh-18rem)] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/owner' || item.to === '/dashboard' || item.to === '/manager'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Institution Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 px-3">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Institution Node</p>
        <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{user.institution}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.department || 'General Faculty'}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
