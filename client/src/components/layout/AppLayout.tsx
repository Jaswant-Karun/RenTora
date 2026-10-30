import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isIntroRoute = location.pathname === '/' || location.pathname === '/intro';
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  // Fullscreen container for intro sequence without distraction
  if (isIntroRoute) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
        <main className="w-full">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex w-full">
        {user && isDashboardRoute && <Sidebar />}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">RENTORA</span>
            <span>—</span>
            <span>Smart Institutional Resource Sharing & Management Platform</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-medium">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              Institutional Resource Federation
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Smart Sharing Protocol
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
