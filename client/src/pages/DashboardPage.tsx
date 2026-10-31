import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHealthApi } from '../api/auth';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Building,
  CheckCircle2,
  Clock,
  Database,
  PlusCircle,
  Search,
  FileCheck,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [healthData, setHealthData] = useState<any>(null);
  const [showWelcomeNotice, setShowWelcomeNotice] = useState(searchParams.get('new') === 'true');

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowWelcomeNotice(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await getHealthApi();
        setHealthData(res);
      } catch (err) {
        console.warn('Backend status fetch warning');
      }
    };
    fetchHealth();
  }, []);

  if (!user) return null;

  const role = user.role;

  // Chart data for resource utilization demonstration
  const chartData = [
    { day: 'Mon', bookings: 12, hours: 38 },
    { day: 'Tue', bookings: 19, hours: 54 },
    { day: 'Wed', bookings: 24, hours: 72 },
    { day: 'Thu', bookings: 31, hours: 95 },
    { day: 'Fri', bookings: 28, hours: 88 },
    { day: 'Sat', bookings: 15, hours: 44 },
    { day: 'Sun', bookings: 8, hours: 22 },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Registration Welcome Banner */}
      <AnimatePresence>
        {showWelcomeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, opacity: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-brand-600/20 via-indigo-600/20 to-cyan-500/20 border border-brand-500/40 backdrop-blur-md flex items-center justify-between gap-4 text-white shadow-xl shadow-brand-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center shrink-0 text-brand-300">
                <Sparkles className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Welcome to RENTORA Institutional Resource Network!
                </p>
                <p className="text-xs text-slate-300">
                  Your account is registered, verified, and secured. You have full access to the{' '}
                  <span className="font-semibold text-brand-300">{user.role.toUpperCase()}</span> workspace.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowWelcomeNotice(false);
                searchParams.delete('new');
                setSearchParams(searchParams);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950/40 to-slate-900 border border-slate-800/80 shadow-2xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
              Institutional Console
            </span>
            <span className="text-slate-600">•</span>
            <Badge role={user.role} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {user.institution} — <span className="text-slate-300 font-medium">{user.department || 'General Faculty'}</span>
          </p>
        </div>

        {/* Live Backend Connection Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200">MongoDB Persistence</span>
            </div>
            {healthData?.database?.state === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-[11px] border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active & Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium text-[11px] border border-amber-500/20">
                Connecting...
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Database host: {healthData?.database?.host || '127.0.0.1:27017'}
          </p>
        </div>
      </div>

      {/* Role-Specific Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              {role === 'student' ? 'Available Equipment' : 'Catalogued Assets'}
            </p>
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">128</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14 newly added this week</span>
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              {role === 'student' ? 'My Bookings' : 'Active Reservations'}
            </p>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">36</p>
          <p className="text-xs text-slate-400 mt-1">
            {role === 'student' ? '2 upcoming this week' : '98% slot occupancy rate'}
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              {role === 'manager' ? 'Compliance Audit' : 'Safety Clearances'}
            </p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">99.4%</p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Zero safety violations logged</span>
          </p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase">
              Equipment Hours Saved
            </p>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">1,420 hrs</p>
          <p className="text-xs text-cyan-400 mt-1">₹3.8L procurement cost avoided</p>
        </Card>
      </div>

      {/* Main Grid: Chart & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Utilization Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Campus Equipment Utilization</h2>
              <p className="text-xs text-slate-400">Total lab hours logged per day</p>
            </div>
            <span className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
              Live Telemetry
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Role Fast-Actions Panel */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-brand-400" />
              <h2 className="text-base font-bold text-white">Actions for {user.role.toUpperCase()}</h2>
            </div>

            <div className="space-y-3">
              {role === 'student' && (
                <>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <p className="text-xs font-bold text-slate-200">Reserve Scanning Electron Microscope</p>
                    <p className="text-[11px] text-slate-400">Materials Science Dept • Slot open tomorrow 10 AM</p>
                    <Button size="sm" variant="outline" className="w-full mt-2" leftIcon={<Search className="w-3.5 h-3.5" />}>
                      Request Slot Clearance
                    </Button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <p className="text-xs font-bold text-slate-200">Industrial 3D Metal Printer</p>
                    <p className="text-[11px] text-slate-400">Robotics Innovation Lab • Fast pass eligible</p>
                    <Button size="sm" variant="secondary" className="w-full mt-2">
                      View Calibration Protocol
                    </Button>
                  </div>
                </>
              )}

              {role === 'owner' && (
                <>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <p className="text-xs font-bold text-slate-200">List New Equipment</p>
                    <p className="text-[11px] text-slate-400">Add instruments from your lab to the institutional pool.</p>
                    <Button size="sm" variant="primary" className="w-full" leftIcon={<PlusCircle className="w-3.5 h-3.5" />}>
                      Register Lab Device
                    </Button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <p className="text-xs font-bold text-slate-200">Slot Schedule Manager</p>
                    <p className="text-[11px] text-slate-400">Block maintenance windows and define booking slots.</p>
                    <Button size="sm" variant="secondary" className="w-full">
                      Configure Schedule
                    </Button>
                  </div>
                </>
              )}

              {role === 'manager' && (
                <>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <p className="text-xs font-bold text-slate-200">Inter-Departmental Approvals</p>
                    <p className="text-[11px] text-slate-400">4 pending access requests awaiting HOD signoff.</p>
                    <Button size="sm" variant="primary" className="w-full">
                      Review Pending (4)
                    </Button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <p className="text-xs font-bold text-slate-200">Campus Asset Audit</p>
                    <p className="text-[11px] text-slate-400">Generate quarterly utilization report for college council.</p>
                    <Button size="sm" variant="secondary" className="w-full">
                      Download PDF Audit
                    </Button>
                  </div>
                </>
              )}

              {role === 'admin' && (
                <>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <p className="text-xs font-bold text-slate-200">Institution Federation</p>
                    <p className="text-[11px] text-slate-400">3 institutions requesting network onboarding.</p>
                    <Button size="sm" variant="primary" className="w-full" leftIcon={<Building className="w-3.5 h-3.5" />}>
                      Manage Partner Colleges
                    </Button>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <p className="text-xs font-bold text-slate-200">Platform Security & Audit</p>
                    <p className="text-[11px] text-slate-400">Inspect JWT signatures, API access limits and database state.</p>
                    <Button size="sm" variant="outline" className="w-full" leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}>
                      Security Diagnostics
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Signed in as <span className="text-slate-300 font-semibold">{user.email}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
