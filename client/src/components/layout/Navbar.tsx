import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Boxes,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, demoAccounts, switchDemoRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/explore" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Boxes className="w-5 h-5 text-brand-400 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                  RENTORA
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-brand-500/10 text-brand-400 rounded-md border border-brand-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Institutional Resource Sharing</p>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/explore" className="text-slate-300 hover:text-white transition-colors">
              Explore Platform
            </Link>
            <Link to="/intro" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Intro Screen
            </Link>
            {user && (
              <Link to="/dashboard" className="text-brand-300 hover:text-brand-200 transition-colors flex items-center gap-1.5 font-semibold">
                <LayoutDashboard className="w-4 h-4" />
                Console
              </Link>
            )}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* Quick Demo Role Switcher for Hackathon Judges */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-amber-300 transition-all"
                title="Quick Role Switcher for Demo"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Demo Roles</span>
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                  <p className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider">
                    Switch Demo Persona
                  </p>
                  <div className="space-y-1">
                    {demoAccounts.map((account) => (
                      <button
                        key={account.role}
                        onClick={async () => {
                          setRoleSwitcherOpen(false);
                          await switchDemoRole(account.role);
                          navigate('/dashboard');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center justify-between transition-colors text-slate-200"
                      >
                        <span className="font-medium">{account.roleLabel}</span>
                        <Badge role={account.role} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-xs">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-medium text-slate-200 leading-tight">{user.name}</p>
                    <Badge role={user.role} size="sm" />
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Log Out">
                  <LogOut className="w-4 h-4 text-slate-400 hover:text-rose-400" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Join Network
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-950 p-4 space-y-3">
          <nav className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 rounded-lg"
            >
              Explore Platform
            </Link>
            {user && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm text-brand-400 font-medium hover:bg-slate-900 rounded-lg flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Console Dashboard
              </Link>
            )}
          </nav>
          <div className="pt-3 border-t border-slate-800 space-y-2">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-3 py-1">
                  <Badge role={user.role} />
                  <span className="text-xs text-slate-300">{user.name}</span>
                </div>
                <Button variant="danger" size="sm" className="w-full" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Join Network
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
