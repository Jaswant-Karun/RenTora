import React from 'react';
import { NavLink } from 'react-router-dom';
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
  Building2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  // Primary navigation as specified by requirements
  const primaryNavItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Explore Resources', to: '/dashboard/explore', icon: Compass },
    { label: 'My Bookings', to: '/dashboard/bookings', icon: CalendarCheck },
    { label: 'Waiting List', to: '/dashboard/waitlist', icon: Clock },
    { label: 'My Activity', to: '/dashboard/activity', icon: Activity },
    { label: 'Notifications', to: '/dashboard/notifications', icon: Bell },
    { label: 'Profile', to: '/dashboard/profile', icon: User },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
  ];

  // Role-specific quick tools
  const roleTools = [
    ...(role === 'owner'
      ? [
          { label: 'My Listed Assets', to: '/dashboard/explore?owner=me', icon: Cpu },
        ]
      : []),
    ...(role === 'manager'
      ? [
          { label: 'Campus Lab Audits', to: '/dashboard/activity?view=audit', icon: Building2 },
        ]
      : []),
    ...(role === 'admin'
      ? [
          { label: 'Security & Federation', to: '/dashboard/activity?view=security', icon: ShieldAlert },
        ]
      : []),
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col justify-between border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md min-h-[calc(100vh-4rem)] p-4">
      <div>
        {/* User Card */}
        <div className="p-3 mb-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 flex items-center space-x-3 shadow-lg">
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

        {/* Primary Menu */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            Main Workspace
          </p>
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
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

        {/* Role Specific Tools if available */}
        {roleTools.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-1">
            <p className="px-3 text-[10px] font-bold text-amber-400/90 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{role.toUpperCase()} Console</span>
            </p>
            {roleTools.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 px-3">
        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Institution Node</p>
        <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">{user.institution}</p>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.department || 'General Faculty'}</p>
      </div>
    </aside>
  );
};

export default Sidebar;
