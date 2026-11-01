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
  AlertTriangle,
  FileText,
  QrCode,
  Sliders,
  Leaf,
  Clock,
  History,
  Shield,
  ExternalLink,
  ChevronRight,
  PlayCircle,
  Search,
  Check,
  Award,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const { user, switchDemoRole, demoAccounts } = useAuth();
  const navigate = useNavigate();
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

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
      navigate(
        role === 'admin'
          ? '/admin'
          : role === 'manager'
          ? '/manager'
          : role === 'owner'
          ? '/owner'
          : '/dashboard'
      );
    } catch (err) {
      console.error(err);
      navigate('/login');
    }
  };

  const demoWorkflowSteps = [
    {
      id: 'A',
      title: 'Login as Student',
      persona: 'Student / Researcher',
      account: 'student@rentora.edu',
      route: '/login',
      action: 'Authenticate using the 1-click Student persona card or standard credentials.',
      expected: 'Student lands on the unified console with active reservations, quick actions, and recent activity.',
    },
    {
      id: 'B',
      title: 'Discover a Resource',
      persona: 'Student / Researcher',
      account: 'student@rentora.edu',
      route: '/dashboard/explore',
      action: 'Filter across 10 institutional categories (e.g. Nanotech Cleanroom, DGX A100 GPU, Haas CNC).',
      expected: 'Rich resource catalog with specifications, availability badges, and estimated hourly values.',
    },
    {
      id: 'C',
      title: 'Check Eligibility & Prerequisites',
      persona: 'Student / Researcher',
      account: 'student@rentora.edu',
      route: '/dashboard/resources/:id',
      action: 'Click resource card to open detail view; inspect safety induction and role prerequisites.',
      expected: 'System verifies student eligibility (e.g., Level 2 Cleanroom Safety induction requirements displayed).',
    },
    {
      id: 'D',
      title: 'Request a Booking',
      persona: 'Student / Researcher',
      account: 'student@rentora.edu',
      route: '/dashboard/resources/:id',
      action: 'Select an available date/timeslot, specify research purpose & faculty supervisor, submit request.',
      expected: 'Request validated against active booking limits; conflict-check confirms slot and sets status to pending.',
    },
    {
      id: 'E',
      title: 'Login as Resource Owner',
      persona: 'Resource / Lab Owner',
      account: 'owner@rentora.edu',
      route: '/owner/bookings',
      action: 'Switch persona to Dr. Meera Raman (Lab Custodian) using top profile menu or demo launcher.',
      expected: 'Owner Bookings dashboard displays pending booking requests with applicant academic profile.',
    },
    {
      id: 'F',
      title: 'Review & Approve Booking',
      persona: 'Resource / Lab Owner',
      account: 'owner@rentora.edu',
      route: '/owner/bookings',
      action: 'Review student request purpose, approve reservation, or suggest transparent alternative slot.',
      expected: 'Booking transitions to "active" (approved); automated notification and cryptographic TrustPass QR token are issued.',
    },
    {
      id: 'G',
      title: 'Login as Student',
      persona: 'Student / Researcher',
      account: 'student@rentora.edu',
      route: '/dashboard/bookings',
      action: 'Switch back to Student persona; navigate to My Bookings tab.',
      expected: 'Booking reflects "Approved / Active"; green TrustPass QR verification action becomes available.',
    },
    {
      id: 'H',
      title: 'Complete Physical Check-In',
      persona: 'Student & Owner',
      account: 'student@rentora.edu',
      route: '/dashboard/bookings & /owner/check-in-out',
      action: 'Present cryptographic TrustPass QR code; owner scans/validates token to confirm physical presence.',
      expected: 'Status advances to "checked_in"; immutable audit record logs handover officer and timestamp.',
    },
    {
      id: 'I',
      title: 'Inspect Pre-Session Condition Report',
      persona: 'Resource Owner / Student',
      account: 'owner@rentora.edu',
      route: '/owner/condition-reports',
      action: 'Open ConditionGuard records; inspect baseline cleanliness, meter reading, and apparatus status.',
      expected: 'Condition report shows operational parameters (e.g. chamber pressure, dial indicator baseline).',
    },
    {
      id: 'J',
      title: 'Complete Check-Out (Return)',
      persona: 'Resource Owner',
      account: 'owner@rentora.edu',
      route: '/owner/check-in-out',
      action: 'Verify apparatus shutdown, nitrogen purge, and tools returned; complete check-out confirmation.',
      expected: 'Booking transitions from "checked_in" to "completed"; timeslot is released back to campus pool.',
    },
    {
      id: 'K',
      title: 'Show Final Condition Report',
      persona: 'Resource Owner',
      account: 'owner@rentora.edu',
      route: '/owner/condition-reports',
      action: 'View post-return ConditionGuard inspection report documenting final apparatus telemetry.',
      expected: 'Cleanliness: passed, operationalStatus: optimal, observations signed off by custodian.',
    },
    {
      id: 'L',
      title: 'Examine Booking History & Audit Trail',
      persona: 'Owner / Manager',
      account: 'owner@rentora.edu / manager@rentora.edu',
      route: '/owner/audit & /manager',
      action: 'Search immutable audit log records by booking ID or resource name.',
      expected: 'Non-repudiation chronological timeline showing creation, approval, check-in, check-out, and actor IPs.',
    },
    {
      id: 'M',
      title: 'Demonstrate FairShare & Waiting List',
      persona: 'Student & Manager',
      account: 'student@rentora.edu / manager@rentora.edu',
      route: '/dashboard/waitlist & /manager',
      action: 'View waitlisted booking for Bio-Molecular Synthesis Lab; examine transparent priority score.',
      expected: 'FairShare explanation modal breaks down department quotas, recency penalty, and queue position #1.',
    },
    {
      id: 'N',
      title: 'Show ResourcePulse & EcoShare Analytics',
      persona: 'Student / Manager',
      account: 'student@rentora.edu / manager@rentora.edu',
      route: '/dashboard/activity & /manager',
      action: 'Review institutional utilization rate, avoided capital purchase expenditure (INR), and carbon offset.',
      expected: 'Interactive Recharts showing monthly utilization trends, avoided cost calculation, and ESG report download.',
    },
  ];

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#172033] flex flex-col">
      {/* Top Hackathon Demo Notice Bar */}
      <div className="bg-[#172033] text-white text-xs py-2 px-4 border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#1769D2] text-[10px] font-bold uppercase tracking-wider">
              Hackathon Evaluation Mode
            </span>
            <span className="text-slate-300 hidden md:inline">
              Simulated Institutional Sandbox • Fictional Demo Data • Safe Synthetic Records
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="text-[#60A5FA] hover:text-white font-medium underline flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Judge Demo Hub (14-Step Flow)</span>
            </button>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              All Passwords: <code className="text-white font-mono bg-slate-800 px-1 rounded">Password123!</code>
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white border-b border-[#E2E8F0] pt-12 pb-16 sm:pb-20 text-center relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-radial from-blue-50/50 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Status Badges */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2 mb-6"
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
                <span className="text-[#D97706] animate-pulse">Connecting...</span>
              ) : systemHealth?.database?.state === 'connected' ? (
                <span className="text-[#16834A] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16834A] animate-ping" />
                  Live MongoDB
                </span>
              ) : (
                <span className="text-[#16834A] font-medium">MongoDB Standby</span>
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
            className="mt-6 text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed"
          >
            RENTORA enables colleges, research institutes, and universities to catalogue,
            schedule, and share technical devices, 3D printers, specialized lab equipment, and collaborative spaces
            with cryptographic custody, transparent algorithmic allocation, and environmental intelligence.
          </motion.p>

          {/* Action Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={() => setIsDemoModalOpen(true)}
              rightIcon={<PlayCircle className="w-4 h-4" />}
            >
              Launch Judge Demo Hub
            </Button>

            <a href="#problem-solution">
              <Button variant="secondary" size="lg">
                Explore Solution & Architecture
              </Button>
            </a>

            <Link to="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Quick Stats Banner */}
          <div className="mt-12 pt-8 border-t border-[#E2E8F0] grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div>
              <p className="text-2xl font-bold text-[#1769D2]">14+</p>
              <p className="text-xs text-[#64748B] mt-0.5">Federated High-End Assets</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#16834A]">100%</p>
              <p className="text-xs text-[#64748B] mt-0.5">Tamper-Proof Audit Trail</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">FairShare</p>
              <p className="text-xs text-[#64748B] mt-0.5">Transparent Allocation</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">TrustPass</p>
              <p className="text-xs text-[#64748B] mt-0.5">Cryptographic QR Custody</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Problem & Solution Section */}
      <section id="problem-solution" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
            The Institutional Challenge
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
            Why Traditional Campus Resource Management Fails
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-2xl mx-auto">
            Universities invest millions in advanced instrumentation, yet departments remain isolated silos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Problem Card */}
          <div className="p-8 rounded-2xl bg-red-50/50 border border-red-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-[#DC2626] font-bold text-sm mb-4">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>The Resource-Sharing Problem</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span><strong>Departmental Silos:</strong> Equipment is locked within individual departments with zero cross-campus discovery or visibility.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span><strong>Low Utilization & Redundant CAPEX:</strong> Multi-lakh apparatus (CNC mills, spectrometers, GPU clusters) sit idle 60–70% of the time while other faculties buy duplicates.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span><strong>Manual Friction & Collisions:</strong> Email threads and paper logbooks create double-bookings, missed cancellations, and untracked downtime.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span><strong>Accountability Vacuum:</strong> When expensive apparatus breaks or degrades, lack of photographic baseline proofs causes finger-pointing and unresolved disputes.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-red-200 text-xs text-red-700 font-medium">
              Result: Wasted institutional budget, delayed student research, and high maintenance disputes.
            </div>
          </div>

          {/* Solution Card */}
          <div className="p-8 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-[#16834A] font-bold text-sm mb-4">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>RENTORA's Engineered Solution</span>
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>Unified Federated Registry:</strong> Single centralized digital catalogue across engineering, sciences, design, and computing faculties.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>FairShare Priority Engine:</strong> Algorithmic, transparent quota enforcement balancing research urgency, past usage, and department quotas without black-box bias.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>TrustPass Cryptographic Handover:</strong> Time-bounded QR access pass preventing unauthorized apparatus operation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>ConditionGuard Dual Baseline:</strong> Mandatory pre-checkin and post-checkout telemetry & condition sign-offs with direct incident escalation.</span>
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-emerald-200 text-xs text-emerald-800 font-medium">
              Result: Up to 40% duplicate CAPEX saved, 3x equipment utilization, and 100% custody clarity.
            </div>
          </div>
        </div>
      </section>

      {/* 2. How the Platform Works (4 Steps) */}
      <section className="bg-white border-y border-[#E2E8F0] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
              End-to-End Governance
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
              How RENTORA Operates in Practice
            </h2>
            <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
              A four-stage lifecycle designed for institutional compliance and seamless researcher experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#1769D2] font-bold text-sm flex items-center justify-center mb-4">
                  01
                </span>
                <h3 className="text-base font-bold text-[#172033]">Discover & Verify</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Browse federated campus assets with multi-parameter filters. System automatically validates user role, prerequisite safety inductions, and department quotas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-[#1769D2] font-semibold flex items-center gap-1">
                <span>Eligibility Engine</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center mb-4">
                  02
                </span>
                <h3 className="text-base font-bold text-[#172033]">Request & FairShare</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Select available timeslots. If slot contention occurs, FairShare calculates transparent priority scores and queues requests in an auditable waitlist.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <span>Conflict-Free Allocation</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-sm flex items-center justify-center mb-4">
                  03
                </span>
                <h3 className="text-base font-bold text-[#172033]">TrustPass Handover</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Upon approval, student receives a cryptographically signed TrustPass QR code. Lab custodian inspects pre-session condition and approves check-in.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
                <span>Cryptographic Custody</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <span className="w-8 h-8 rounded-full bg-emerald-50 text-[#16834A] font-bold text-sm flex items-center justify-center mb-4">
                  04
                </span>
                <h3 className="text-base font-bold text-[#172033]">Return & EcoShare</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Post-session checkout records final condition report. EcoShare computes avoided acquisition cost (INR) and CO2 carbon offset metrics in real-time.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] text-[11px] text-[#16834A] font-semibold flex items-center gap-1">
                <span>Sustainability Pulse</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Key Differentiating Features */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
            Platform Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
            Core Differentiating Features
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
            Architected specifically for the rigor, safety, and governance standards of premier universities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card hoverEffect className="p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 border border-indigo-200">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">TrustPass Handover</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Cryptographically signed, time-bounded QR tokens presented by researchers at physical apparatus handover. Ensures non-transferable, authenticated custody verification.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16834A] flex items-center justify-center mb-4 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">ConditionGuard Dual Inspection</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Mandatory before-checkin and after-checkout inspections capturing meter readings, chamber pressures, and cleanliness reports to eliminate damage disputes completely.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769D2] flex items-center justify-center mb-4 border border-blue-200">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">FairShare Allocation Engine</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Transparent multi-factor priority algorithm preventing lab monopolization. Factors department weekly limits, academic seniority tiers, and recent usage cooldowns.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 border border-emerald-200">
              <Leaf className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">ResourcePulse & EcoShare</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Translates equipment sharing into concrete ESG impact metrics: avoided equipment procurement expenditure (INR) and calculated carbon footprint avoidance (kg CO2e).
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-[#172033] flex items-center justify-center mb-4 border border-slate-300">
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Immutable Audit Trail</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Permanent institutional event ledger recording every reservation, status transition, safety incident report, and managerial override with non-repudiation timestamps.
            </p>
          </Card>

          <Card hoverEffect className="p-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center mb-4 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#172033]">Incident & Safety Triage</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Integrated reporting for emergency e-stops, tool wear, and protocol anomalies. Automates immediate quarantine, custodian alert, and Dean review workflows.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. User Roles Section */}
      <section className="bg-white border-y border-[#E2E8F0] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
              Interactive Personas
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
              Role-Based Access Control (RBAC)
            </h2>
            <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
              Click any persona below to launch the live platform with instant institutional privileges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Student */}
            <Card hoverEffect className="flex flex-col justify-between p-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16834A] flex items-center justify-center mb-4 border border-emerald-200">
                  <Users className="w-5 h-5" />
                </div>
                <Badge role="student" />
                <h3 className="text-base font-bold text-[#172033] mt-2">Student / Researcher</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Discover apparatus across campus, verify training prerequisites, book conflict-free slots, check in with TrustPass, and view personal sustainability impact.
                </p>
                <div className="mt-3 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600">
                  student@rentora.edu
                </div>
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

            {/* Owner */}
            <Card hoverEffect className="flex flex-col justify-between p-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center mb-4 border border-[#1769D2]/20">
                  <Cpu className="w-5 h-5" />
                </div>
                <Badge role="owner" />
                <h3 className="text-base font-bold text-[#172033] mt-2">Resource / Lab Owner</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Catalogue department assets, configure operating windows, review applicant research goals, execute physical check-in/out, and sign condition reports.
                </p>
                <div className="mt-3 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600">
                  owner@rentora.edu
                </div>
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

            {/* Manager */}
            <Card hoverEffect className="flex flex-col justify-between p-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center mb-4 border border-amber-200">
                  <Building className="w-5 h-5" />
                </div>
                <Badge role="manager" />
                <h3 className="text-base font-bold text-[#172033] mt-2">Institution Manager</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Campus-wide governance, inter-departmental allocation policies, waitlist promotion overrides, incident resolution, and avoided procurement cost accounting.
                </p>
                <div className="mt-3 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600">
                  manager@rentora.edu
                </div>
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

            {/* Admin */}
            <Card hoverEffect className="flex flex-col justify-between p-6">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 border border-indigo-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <Badge role="admin" />
                <h3 className="text-base font-bold text-[#172033] mt-2">Platform Administrator</h3>
                <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                  Multi-institution federation, enterprise security controls, immutable audit log verification, system health telemetry, and global data governance.
                </p>
                <div className="mt-3 p-2 bg-slate-50 rounded text-[11px] font-mono text-slate-600">
                  admin@rentora.edu
                </div>
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
        </div>
      </section>

      {/* 5. Benefits for Institutions */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
            Institutional Impact
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] mt-3">
            Measurable Value for Universities & Colleges
          </h2>
          <p className="text-sm text-[#64748B] mt-2 max-w-xl mx-auto">
            Tangible financial, operational, and sustainability dividends for university leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
            <div className="text-3xl font-extrabold text-[#1769D2] mb-2">40% CAPEX</div>
            <h3 className="text-base font-bold text-[#172033]">Avoided Redundant Purchases</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              When Deans and Department Heads can see idle capacity in neighboring engineering labs, they approve resource-sharing grants instead of spending crores on duplicative instrumentation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
            <div className="text-3xl font-extrabold text-[#16834A] mb-2">3x Uptime</div>
            <h3 className="text-base font-bold text-[#172033]">Maximized Apparatus Utilization</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Structured reservation slots, automatic waitlist refills upon cancellation, and peak-hour throttling increase actual research usage of high-end equipment from 25% to over 75%.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
            <div className="text-3xl font-extrabold text-indigo-600 mb-2">Zero Disputes</div>
            <h3 className="text-base font-bold text-[#172033]">100% Custody Transparency</h3>
            <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
              Cryptographic QR check-in paired with ConditionGuard pre/post photo baselines and an immutable audit trail eliminates ambiguous damage disputes between students and lab supervisors.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Hackathon Demonstration Guide (14-Step Flow A to N) */}
      <section id="demo-guide" className="bg-slate-900 text-white py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Official Judging Script
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-3">
                14-Step Hackathon Demonstration Flow
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                The complete verification sequence (Flow A to N) demonstrating all key platform capabilities with fictional demo accounts.
              </p>
            </div>

            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="px-4 py-2 bg-[#1769D2] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start md:self-auto transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Launch Demo Quick-Switcher</span>
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
            {demoWorkflowSteps.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStepTab(idx)}
                className={`p-2.5 rounded-lg text-left transition-all border ${
                  activeStepTab === idx
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="text-[10px] font-bold opacity-75">Step {step.id}</div>
                <div className="text-xs font-semibold truncate mt-0.5">{step.title}</div>
              </button>
            ))}
          </div>

          {/* Active Step Showcase Card */}
          {demoWorkflowSteps[activeStepTab] && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                    {demoWorkflowSteps[activeStepTab].id}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Step {demoWorkflowSteps[activeStepTab].id}: {demoWorkflowSteps[activeStepTab].title}
                    </h3>
                    <p className="text-xs text-blue-400 font-mono mt-0.5">
                      Target Route: {demoWorkflowSteps[activeStepTab].route}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Persona:</span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-700 text-xs text-white font-medium">
                    {demoWorkflowSteps[activeStepTab].persona}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-900 text-xs font-mono text-slate-300">
                    {demoWorkflowSteps[activeStepTab].account}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Action to Perform
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                    {demoWorkflowSteps[activeStepTab].action}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    Expected Verification & Proof
                  </h4>
                  <p className="text-sm text-emerald-200 leading-relaxed bg-emerald-950/30 p-4 rounded-xl border border-emerald-900/40">
                    {demoWorkflowSteps[activeStepTab].expected}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between">
                <button
                  disabled={activeStepTab === 0}
                  onClick={() => setActiveStepTab((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-xs font-medium text-white transition-colors"
                >
                  Previous Step
                </button>

                <span className="text-xs text-slate-400">
                  Step {activeStepTab + 1} of {demoWorkflowSteps.length}
                </span>

                <button
                  disabled={activeStepTab === demoWorkflowSteps.length - 1}
                  onClick={() => setActiveStepTab((prev) => Math.min(demoWorkflowSteps.length - 1, prev + 1))}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-xs font-medium text-white transition-colors"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Demo Modal / Hub Popup */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1769D2] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Hackathon Judge Demo Launcher</h3>
                  <p className="text-xs text-[#64748B]">Instant 1-click access to all 4 demonstration personas</p>
                </div>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <strong>Simulated Demo Environment:</strong> All accounts pre-loaded with representative resources, pending/approved reservations, waitlist queue, condition reports, and audit logs. All passwords are <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">Password123!</code>.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {demoAccounts.map((account) => (
                <div
                  key={account.role}
                  className="p-4 rounded-xl border border-slate-200 hover:border-[#1769D2] hover:bg-blue-50/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#172033]">{account.name}</span>
                      <Badge role={account.role} size="sm" />
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">{account.email}</p>
                    <p className="text-xs text-slate-600 mt-2">
                      {account.role === 'student' && 'Explore catalog, book slots, present TrustPass QR, inspect personal usage.'}
                      {account.role === 'owner' && 'Approve bookings, execute check-in/out, file condition reports & manage assets.'}
                      {account.role === 'manager' && 'Oversee campus quotas, promote waitlists, inspect ResourcePulse metrics.'}
                      {account.role === 'admin' && 'Audit logs, system health, security policies, and institutional federation.'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => {
                      setIsDemoModalOpen(false);
                      handleQuickLogin(account.role);
                    }}
                  >
                    Login as {account.role.toUpperCase()}
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748B]">
              <span>Team Storm Breakerz • Lead: Jaswant Karun S A</span>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="text-slate-600 hover:underline font-medium"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
