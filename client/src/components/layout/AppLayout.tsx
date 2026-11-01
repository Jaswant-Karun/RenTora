import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from '../common/Breadcrumbs';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Shield, Sparkles } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isIntroRoute = location.pathname === '/intro';
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';
  const isLandingRoute = location.pathname === '/' || location.pathname === '/landing';

  // Standalone layout for Intro or Auth without sidebar
  if (isIntroRoute || isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#172033] antialiased">
        <main className="w-full">{children}</main>
      </div>
    );
  }

  // Standalone full-width layout for Landing Page when not in dashboard
  if (isLandingRoute && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#172033] antialiased">
        <Navbar />
        <main className="w-full flex-1">{children}</main>
        <footer className="border-t border-[#E2E8F0] bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-[#64748B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#172033]">RENTORA</span>
              <span>—</span>
              <span>Smart Institutional Resource Sharing & Management Platform</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-[#64748B]">Team: Storm Breakerz</span>
              <span>•</span>
              <span className="text-[#64748B]">Leader: Jaswant Karun S A</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#1769D2]">
                <Shield className="w-3 h-3" />
                Verified Federation
              </span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#172033] antialiased">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      {user && (
        <Sidebar
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Breadcrumbs for internal console pages */}
          {user && <Breadcrumbs />}
          {children}
        </main>

        {/* Enterprise Clean Footer */}
        <footer className="border-t border-[#E2E8F0] bg-white py-4 px-4 sm:px-6 lg:px-8 text-xs text-[#64748B]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[#172033]">RENTORA</span>
              <span>—</span>
              <span>Smart Institutional Resource Sharing & Management Platform</span>
            </div>

            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-[#64748B]">Team: Storm Breakerz</span>
              <span>•</span>
              <span className="text-[#64748B]">Leader: Jaswant Karun S A</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[#1769D2]">
                <Shield className="w-3 h-3" />
                Verified Federation
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
