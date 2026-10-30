import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  Cpu,
  Building2,
  CheckCircle2,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    ...(role === 'student'
      ? [
          { label: 'Browse Equipment & Spaces', to: '/dashboard/resources', icon: Search },
          { label: 'My Bookings', to: '/dashboard/bookings', icon: CalendarCheck },
          { label: 'Lab Passes', to: '/dashboard/passes', icon: ShieldCheck },
        ]
      : []),
    ...(role === 'owner'
      ? [
          { label: 'My Listed Equipment', to: '/dashboard/my-resources', icon: Cpu },
          { label: 'Incoming Requests', to: '/dashboard/requests', icon: CheckCircle2 },
          { label: 'Schedule & Slots', to: '/dashboard/schedule', icon: CalendarCheck },
        ]
      : []),
    ...(role === 'manager'
      ? [
          { label: 'Institution Labs', to: '/dashboard/labs', icon: Building2 },
          { label: 'Department Approvals', to: '/dashboard/approvals', icon: CheckCircle2 },
          { label: 'Resource Utilization', to: '/dashboard/analytics', icon: BarChart3 },
        ]
      : []),
    ...(role === 'admin'
      ? [
          { label: 'Platform Analytics', to: '/dashboard/analytics', icon: BarChart3 },
          { label: 'Institution Network', to: '/dashboard/institutions', icon: Building2 },
          { label: 'Users & Permissions', to: '/dashboard/users', icon: Users },
          { label: 'System Compliance', to: '/dashboard/compliance', icon: ShieldCheck },
        ]
      : []),
    { label: 'Account Settings', to: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-800/80 bg-slate-950/60 min-h-[calc(100vh-4rem)] p-4">
      {/* Profile summary */}
      <div className="p-3 mb-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
          <div className="mt-1">
            <Badge role={user.role} size="sm" />
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
          Workspace Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-800/60 px-3">
        <p className="text-[11px] text-slate-500">Institution</p>
        <p className="text-xs font-semibold text-slate-300 truncate mt-0.5">{user.institution}</p>
        <p className="text-[11px] text-slate-500 mt-1">{user.department || 'General Department'}</p>
      </div>
    </aside>
  );
};
