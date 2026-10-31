import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHealthApi } from '../api/auth';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
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
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] pt-16 pb-20 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Badges */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-6"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#1769D2]/20 text-[#1769D2] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Institutional Resource Sharing</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-[#E2E8F0] text-xs text-[#64748B]">
              <span className="font-semibold text-[#172033]">Campus Federation</span>
              <span>•</span>
              <span>Inter-Departmental Pool</span>
            </div>

            {/* Database indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-[#E2E8F0] text-xs">
              <Database className="w-3.5 h-3.5 text-[#1769D2]" />
              <span className="text-[#64748B]">Database:</span>
              {healthLoading ? (
                <span className="text-[#D97706] animate-pulse">Checking...</span>
              ) : systemHealth?.database?.state === 'connected' ? (
                <span className="text-[#16834A] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-ping" />
                  Live MongoDB
                </span>
              ) : (
                <span className="text-[#D97706] font-medium">MongoDB Standby</span>
              )}
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#172033] max-w-4xl mx-auto leading-tight"
          >
            Institutional Resource Sharing <span className="text-[#1769D2]">Reimagined.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed"
          >
            RENTORA enables colleges, research laboratories, and universities to safely catalogue,
            schedule, and share technical devices, 3D printers, specialized lab equipment, and collaborative spaces.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
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
        </div>
      </section>

      {/* Role Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
            Interactive Institutional Personas
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
            Experience RENTORA Across Roles
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
            Test role-based access control (RBAC) instantly with verified institutional accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Persona 1: Student */}
          <Card hoverEffect className="flex flex-col justify-between p-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16834A] flex items-center justify-center mb-4 border border-emerald-200">
                <Users className="w-5 h-5" />
              </div>
              <Badge role="student" />
              <h3 className="text-base font-bold text-[#172033] mt-2">Student / Researcher</h3>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Discover equipment across departments, book slots, request safety clearances, and track returns.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[#16834A] border-emerald-200 hover:bg-emerald-50"
                onClick={() => handleQuickLogin('student')}
              >
                Launch as Student
              </Button>
            </div>
          </Card>

          {/* Persona 2: Owner */}
          <Card hoverEffect className="flex flex-col justify-between p-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center mb-4 border border-[#1769D2]/20">
                <Cpu className="w-5 h-5" />
              </div>
              <Badge role="owner" />
              <h3 className="text-base font-bold text-[#172033] mt-2">Resource / Lab Owner</h3>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                List idle spectrometers, 3D printers, server clusters; manage timeslots, inspect usage logs, and review requests.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[#1769D2] border-[#1769D2]/30 hover:bg-[#EFF6FF]"
                onClick={() => handleQuickLogin('owner')}
              >
                Launch as Lab Owner
              </Button>
            </div>
          </Card>

          {/* Persona 3: Manager */}
          <Card hoverEffect className="flex flex-col justify-between p-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center mb-4 border border-amber-200">
                <Building className="w-5 h-5" />
              </div>
              <Badge role="manager" />
              <h3 className="text-base font-bold text-[#172033] mt-2">Institution Manager</h3>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Oversee inter-departmental equipment sharing, campus utilization metrics, department budgets, and safety.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-[#D97706] border-amber-200 hover:bg-amber-50"
                onClick={() => handleQuickLogin('manager')}
              >
                Launch as Manager
              </Button>
            </div>
          </Card>

          {/* Persona 4: Admin */}
          <Card hoverEffect className="flex flex-col justify-between p-6">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 border border-indigo-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <Badge role="admin" />
              <h3 className="text-base font-bold text-[#172033] mt-2">Platform Administrator</h3>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Lead administrator controls, verify partner colleges, audit security, inspect platform health and global policies.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                onClick={() => handleQuickLogin('admin')}
              >
                Launch as Admin
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="bg-white border-t border-[#E2E8F0] py-16" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center mb-4 border border-[#1769D2]/20">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">Smart Conflict-Free Scheduling</h3>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Automated reservation system preventing overlapping bookings and ensuring fair resource allocation across campus research groups.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 border border-indigo-200">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">Cross-Department Federation</h3>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Break down institutional silos. Allow engineering, chemistry, and biotechnology departments to share high-cost lab machinery safely.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16834A] flex items-center justify-center mb-4 border border-emerald-200">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">Verified Equipment Custody</h3>
              <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                Pre-booking safety checklists, condition reports, digital check-in/out timestamps, and faculty mentor endorsements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
