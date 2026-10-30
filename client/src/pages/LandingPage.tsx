import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHealthApi } from '../api/auth';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
  Boxes,
  Cpu,
  Building,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  CalendarCheck,
  CheckCircle,
  Database,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await getHealthApi();
        setSystemHealth(data);
      } catch (err) {
        console.warn('Backend not reached yet');
      } finally {
        setHealthLoading(false);
      }
    };
    fetchHealth();
  }, []);

  const handleQuickLogin = async (role: any) => {
    try {
      await switchDemoRole(role);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      navigate('/login');
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-brand-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        {/* System & Team Status Badges */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mb-6"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Problem Statement: Unlock Underused Equipment and Spaces</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className="font-semibold text-slate-100">Smart Campus Federation</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Inter-Departmental Pool</span>
          </div>

          {/* Real Backend / MongoDB Connection Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Database:</span>
            {healthLoading ? (
              <span className="text-amber-400 animate-pulse">Checking...</span>
            ) : systemHealth?.database?.state === 'connected' ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                MongoDB Atlas Live
              </span>
            ) : (
              <span className="text-amber-400 font-medium">MongoDB Standby</span>
            )}
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]"
        >
          Institutional Resource Sharing{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Reimagined.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
        >
          RENTORA enables colleges, research laboratories, and universities to safely
          catalogue, schedule, and share sophisticated technical devices, 3D printers,
          specialized lab equipment, and collaborative spaces.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {user ? (
            <Link to="/dashboard">
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Dashboard ({user.role.toUpperCase()})
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Join Institutional Network
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign In to Account
                </Button>
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* Role Showcase & Fast Hackathon Demo Persona Selector */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800/60">
        <div className="text-center mb-10">
          <Badge variant="brand">Interactive Hackathon Experience</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Experience RENTORA as Any Institutional Persona
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Test our role-based access control (RBAC) instantly. Click any persona below to authenticate with verified demo credentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Persona 1: Student */}
          <Card hoverEffect className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <Badge role="student" />
              <h3 className="text-lg font-bold text-slate-100 mt-2">Student / Researcher</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Search high-end equipment across departments, book slots, request safety clearances, and manage project approvals.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                onClick={() => handleQuickLogin('student')}
              >
                Launch as Student
              </Button>
            </div>
          </Card>

          {/* Persona 2: Owner */}
          <Card hoverEffect className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <Badge role="owner" />
              <h3 className="text-lg font-bold text-slate-100 mt-2">Resource / Lab Owner</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                List idle spectrometers, 3D printers, server clusters; manage timeslots, inspect usage logs, and approve student requests.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
                onClick={() => handleQuickLogin('owner')}
              >
                Launch as Lab Owner
              </Button>
            </div>
          </Card>

          {/* Persona 3: Manager */}
          <Card hoverEffect className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Building className="w-6 h-6" />
              </div>
              <Badge role="manager" />
              <h3 className="text-lg font-bold text-slate-100 mt-2">Institution Manager</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Oversee inter-departmental equipment sharing, campus utilization metrics, department budgets, and compliance safety.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => handleQuickLogin('manager')}
              >
                Launch as Manager
              </Button>
            </div>
          </Card>

          {/* Persona 4: Admin */}
          <Card hoverEffect className="flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <Badge role="admin" />
              <h3 className="text-lg font-bold text-slate-100 mt-2">Platform Administrator</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Lead administrator controls, verify partner colleges, audit security, inspect platform health and global sharing treaties.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/10"
                onClick={() => handleQuickLogin('admin')}
              >
                Launch as Admin
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="features">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Smart Conflict-Free Scheduling</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Automated reservation system preventing overlapping bookings and ensuring fair resource allocation across campus research groups.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Cross-Department Federation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Break down institutional silos. Allow mechanical engineering, electronics, chemistry, and biotechnology departments to share high-cost lab machinery safely.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Verified Equipment Custody</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Pre-booking safety checklists, damage liability contracts, digital check-in/out timestamps, and faculty mentor endorsements.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
