import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getManagerStatsApi,
  getResourceApprovalsApi,
  updateResourceApprovalApi,
  getUsersForVerificationApi,
  toggleUserVerificationApi,
  getSchedulingConflictsApi,
  resolveConflictApi,
  getManagerIncidentsApi,
  updateIncidentStatusApi,
  getManagerDisputesApi,
  resolveDisputeApi,
  getFairAllocationSettingsApi,
  updateFairAllocationSettingsApi,
  ManagerStatsData,
} from '../../api/manager.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Building2,
  BarChart3,
  CheckCircle2,
  XCircle,
  Users,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Settings,
  Layers,
  Clock,
  UserCheck,
  UserX,
  Cpu,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Save,
  Check,
  AlertCircle,
  Calendar,
  History,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AuditLedgerViewer } from '../../components/manager/AuditLedgerViewer';
import { ManagerOverrideModal } from '../../components/manager/ManagerOverrideModal';
import { ResourceUtilizationDashboard } from '../../components/ai/ResourceUtilizationDashboard';
import { IncidentSummaryModal } from '../../components/ai/IncidentSummaryModal';

type ManagerTab =
  | 'stats'
  | 'ai-analytics'
  | 'approvals'
  | 'users'
  | 'eligibility'
  | 'waitlist'
  | 'conflicts'
  | 'incidents'
  | 'disputes'
  | 'fair-allocation'
  | 'audit';

export const ManagerDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const getInitialTab = (): ManagerTab => {
    const tabParam = searchParams.get('tab') as ManagerTab;
    const validTabs: ManagerTab[] = [
      'stats',
      'ai-analytics',
      'approvals',
      'users',
      'eligibility',
      'waitlist',
      'conflicts',
      'incidents',
      'disputes',
      'fair-allocation',
      'audit',
    ];
    if (tabParam && validTabs.includes(tabParam)) return tabParam;
    const sub = location.pathname.replace('/manager/', '').replace('/manager', '').trim() as ManagerTab;
    if (sub && validTabs.includes(sub)) return sub;
    return 'stats';
  };

  const [activeTab, setActiveTab] = useState<ManagerTab>(getInitialTab);

  useEffect(() => {
    const tab = getInitialTab();
    setActiveTab(tab);
  }, [searchParams, location.pathname]);

  const handleTabChange = (newTab: ManagerTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<ManagerStatsData | null>(null);
  const [waitlistBookings, setWaitlistBookings] = useState<any[]>([]);
  const [selectedOverrideBooking, setSelectedOverrideBooking] = useState<any | null>(null);
  const [selectedAiIncident, setSelectedAiIncident] = useState<any | null>(null);

  // Module States
  const [approvals, setApprovals] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [fairAllocation, setFairAllocation] = useState<any>({
    maxHoursPerWeekPerUser: 12,
    maxActiveBookingsPerUser: 3,
    peakHoursStart: '10:00',
    peakHoursEnd: '16:00',
    allowCrossInstitution: true,
    prioritizeUnderrepresentedDepts: true,
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [disputeResolutionText, setDisputeResolutionText] = useState('');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        approvalsRes,
        usersRes,
        conflictsRes,
        incidentsRes,
        disputesRes,
        fairAllocationRes,
      ] = await Promise.all([
        getManagerStatsApi(),
        getResourceApprovalsApi(),
        getUsersForVerificationApi(),
        getSchedulingConflictsApi(),
        getManagerIncidentsApi(),
        getManagerDisputesApi(),
        getFairAllocationSettingsApi(),
      ]);

      if (statsRes.success) setStatsData(statsRes.data);
      if (approvalsRes.success) setApprovals(approvalsRes.data);
      if (usersRes.success) setUsersList(usersRes.data);
      if (conflictsRes.success) setConflicts(conflictsRes.data);
      if (incidentsRes.success) setIncidents(incidentsRes.data);
      if (disputesRes.success) setDisputes(disputesRes.data);
      if (fairAllocationRes.success && fairAllocationRes.data) {
        setFairAllocation(fairAllocationRes.data);
      }

      // Fetch waitlist queue
      try {
        const token = localStorage.getItem('token');
        const resWaitlist = await fetch('/api/fairness/waitlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const waitlistJson = await resWaitlist.json();
        if (waitlistJson.success) {
          setWaitlistBookings(waitlistJson.data);
        }
      } catch (e) {
        console.error('Error fetching waitlist queue:', e);
      }
    } catch (err) {
      console.error('Error loading manager dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // 2. Resource Approval Handler
  const handleApproveResource = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const res = await updateResourceApprovalApi(id, status);
      if (res.success) {
        showToast(`Resource ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. User Verification Handler
  const handleToggleUserVerification = async (id: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const res = await toggleUserVerificationApi(id, !currentStatus);
      if (res.success) {
        showToast(`User verification ${!currentStatus ? 'confirmed' : 'revoked'}.`);
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Conflict Resolution Handler
  const handleResolveConflict = async (approvedId: string, alternateId: string) => {
    setActionLoading(true);
    try {
      const res = await resolveConflictApi({
        approvedBookingId: approvedId,
        alternateBookingId: alternateId,
        action: 'promote_primary',
      });
      if (res.success) {
        showToast('Collision resolved: Primary booking confirmed, conflicting reservation waitlisted.');
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Incident Review Handler
  const handleUpdateIncident = async (id: string, status: string) => {
    setActionLoading(true);
    try {
      const res = await updateIncidentStatusApi(id, {
        status,
        resolutionNotes: `Status updated to ${status} by Institutional Manager`,
      });
      if (res.success) {
        showToast(`Incident marked as ${status}.`);
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Dispute Resolution Handler
  const handleResolveDispute = async (id: string) => {
    if (!disputeResolutionText.trim()) return;
    setActionLoading(true);
    try {
      const res = await resolveDisputeApi(id, disputeResolutionText);
      if (res.success) {
        showToast('Binding dispute resolution registered successfully.');
        setSelectedDisputeId(null);
        setDisputeResolutionText('');
        await fetchAllData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // 9. Fair Allocation Handler
  const handleSaveFairAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await updateFairAllocationSettingsApi(fairAllocation);
      if (res.success) {
        showToast('Institution-wide Fair Allocation policy updated.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !statsData) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner message="Initializing institutional governance hub..." size="lg" />
      </div>
    );
  }

  const navTabs = [
    { id: 'stats' as ManagerTab, label: 'Institution Stats', icon: BarChart3, count: null },
    { id: 'ai-analytics' as ManagerTab, label: 'AI Utilization & Demand', icon: Sparkles, count: null },
    { id: 'approvals' as ManagerTab, label: 'Resource Approvals', icon: CheckCircle2, count: approvals.filter((a) => a.approvalStatus === 'pending').length },
    { id: 'users' as ManagerTab, label: 'User Verification', icon: Users, count: usersList.filter((u) => !u.isVerified).length },
    { id: 'eligibility' as ManagerTab, label: 'Eligibility Management', icon: ShieldCheck, count: null },
    { id: 'waitlist' as ManagerTab, label: 'Waiting Lists & Overrides', icon: Clock, count: waitlistBookings.length },
    { id: 'conflicts' as ManagerTab, label: 'Conflict Resolution', icon: AlertTriangle, count: conflicts.length },
    { id: 'incidents' as ManagerTab, label: 'Incident Review', icon: AlertCircle, count: incidents.filter((i) => i.status !== 'resolved').length },
    { id: 'disputes' as ManagerTab, label: 'Dispute Arbitration', icon: Scale, count: disputes.filter((d) => d.status === 'open').length },
    { id: 'fair-allocation' as ManagerTab, label: 'Fair Allocation', icon: Settings, count: null },
    { id: 'audit' as ManagerTab, label: 'Immutable Audit Ledger', icon: History, count: null },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Institutional Resource Governance Hub
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Campus-wide asset allocation, compliance monitoring, conflict arbitration, and fair-share scheduling.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs font-semibold text-[#1769D2] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1769D2]" />
            RBAC: Institutional Manager / Admin
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 shadow-sm"
          >
            <Check className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[#E2E8F0]">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#1769D2] text-white border-[#1769D2] shadow-sm'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#172033] hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.count !== null && t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white text-[#1769D2]' : 'bg-rose-500 text-white'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Institution-wide resource statistics */}
      {activeTab === 'stats' && statsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Total Campus Assets
              </span>
              <p className="text-3xl font-extrabold text-[#172033] mt-2">{statsData.stats.totalResources}</p>
              <p className="text-xs text-[#64748B] mt-1">Across 10 academic classifications</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Active Bookings
              </span>
              <p className="text-3xl font-extrabold text-[#1769D2] mt-2">{statsData.stats.activeBookings}</p>
              <p className="text-xs text-[#64748B] mt-1">Simultaneous laboratory sessions</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Campus Safety Score
              </span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">{statsData.stats.campusSafetyScore}</p>
              <p className="text-xs text-[#64748B] mt-1">OSHA / ISO compliance rating</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
              <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Avoided Procurement Cost
              </span>
              <p className="text-3xl font-extrabold text-amber-600 mt-2">{statsData.stats.utilizationAvoidedCost}</p>
              <p className="text-xs text-[#64748B] mt-1">Resource sharing grant savings</p>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1769D2]" />
              Department Resource Utilization & Allocation
            </h3>
            <div className="space-y-4 pt-2">
              {statsData.deptUtilization.map((dept) => (
                <div key={dept.department} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#172033]">{dept.department}</span>
                    <span className="text-[#64748B]">
                      {dept.assetsCount} Assets • {dept.totalBookings} Total Reservations
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-[#1769D2] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(15, dept.totalBookings * 10))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab AI: Campus Resource Utilization & Peak Demand Intelligence */}
      {activeTab === 'ai-analytics' && (
        <div className="space-y-4">
          <ResourceUtilizationDashboard />
        </div>
      )}

      {/* Tab 2: Resource approval management */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#172033]">Pending Equipment & Lab Approvals</h2>
            <span className="text-xs text-[#64748B]">
              {approvals.filter((a) => a.approvalStatus === 'pending').length} requiring review
            </span>
          </div>

          {approvals.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#172033]">All resources approved</h3>
              <p className="text-xs text-[#64748B] mt-1">No equipment waiting for institutional sanctioning.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvals.map((res) => (
                <div
                  key={res._id}
                  className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EFF6FF] text-[#1769D2] border border-blue-100">
                        {res.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          res.approvalStatus === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : res.approvalStatus === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}
                      >
                        {res.approvalStatus || 'pending'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#172033]">{res.name}</h3>
                    <p className="text-xs text-[#64748B] line-clamp-2">{res.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-[#64748B]">
                      <span>Location: <strong className="text-[#172033]">{res.location}</strong></span>
                      <span>Owner: <strong className="text-[#172033]">{res.owner?.name || 'Department Custodian'}</strong></span>
                      <span>Safety Instructions: {res.safetyInstructions?.length || 0} items</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveResource(res._id, 'approved')}
                      disabled={actionLoading || res.approvalStatus === 'approved'}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Resource
                    </button>
                    <button
                      onClick={() => handleApproveResource(res._id, 'rejected')}
                      disabled={actionLoading || res.approvalStatus === 'rejected'}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Reject Listing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: User verification */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#172033]">Institutional User Verification & Roles</h2>
            <span className="text-xs text-[#64748B]">{usersList.length} registered accounts</span>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">System Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[#172033]">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <p className="font-semibold text-[#172033]">{u.name}</p>
                      <p className="text-[11px] text-[#64748B]">{u.email}</p>
                    </td>
                    <td className="p-3.5 text-[#64748B]">{u.department || 'General Science'}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase bg-slate-100 text-[#172033] border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.isVerified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {u.isVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleToggleUserVerification(u._id, !!u.isVerified)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                          u.isVerified
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                        }`}
                      >
                        {u.isVerified ? (
                          <>
                            <UserX className="w-3.5 h-3.5" /> Revoke
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" /> Verify User
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Eligibility management */}
      {activeTab === 'eligibility' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#172033]">Institutional Eligibility & Access Tier Policies</h2>
            <p className="text-xs text-[#64748B] mt-1">
              Configure baseline criteria required before borrowers can reserve high-grade research instruments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-[#1769D2] font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                Tier 1: General Equipment
              </div>
              <p className="text-xs text-[#64748B]">Classrooms, Meeting Rooms, Basic AV Tools</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-2 text-xs">
                <p className="text-emerald-700 font-semibold">✓ Open to all active students</p>
                <p className="text-[#64748B]">• Institutional email domain required</p>
                <p className="text-[#64748B]">• Max 4 hours per continuous session</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Cpu className="w-5 h-5" />
                Tier 2: Specialized Labs
              </div>
              <p className="text-xs text-[#64748B]">3D Printers, Electronics Workbenches, Test Gear</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-2 text-xs">
                <p className="text-indigo-700 font-semibold">✓ Verified ID required</p>
                <p className="text-[#64748B]">• Lab safety orientation prerequisite</p>
                <p className="text-[#64748B]">• Owner approval required</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                Tier 3: Hazardous & High-Voltage
              </div>
              <p className="text-xs text-[#64748B]">Electron Microscopes, CNC Mills, Cleanrooms</p>
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-2 text-xs">
                <p className="text-amber-700 font-semibold">✓ Faculty supervision mandatory</p>
                <p className="text-[#64748B]">• Certified training credential on file</p>
                <p className="text-[#64748B]">• Incident bond / deposit active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Waiting-list management */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#172033]">Central Waitlist Queue & Automated Progression</h2>
            <span className="text-xs text-[#64748B]">Automated FIFO with Fair-Share Prioritization</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <p className="text-xs text-[#64748B]">
              When an approved reservation is cancelled by a student or rejected, RENTORA automatically dispatches an
              instant booking opportunity to the first eligible candidate in the waiting list queue.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0]">
                <span className="text-[#64748B]">Response Window</span>
                <p className="text-base font-bold text-[#172033] mt-1">2 Hours</p>
                <p className="text-[11px] text-[#64748B]">Waitlist candidate claim window</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0]">
                <span className="text-[#64748B]">Automated Fallback</span>
                <p className="text-base font-bold text-emerald-600 mt-1">Active</p>
                <p className="text-[11px] text-[#64748B]">Auto-bumps next user on timeout</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-[#E2E8F0]">
                <span className="text-[#64748B]">Seniority Quota</span>
                <p className="text-base font-bold text-indigo-600 mt-1">Final-Year Priority</p>
                <p className="text-[11px] text-[#64748B]">Thesis project weighting enabled</p>
              </div>
            </div>

            {/* Live Standby Bookings Table */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
              <h3 className="text-sm font-bold text-[#172033] flex items-center justify-between">
                <span>Active Waitlist Standby Queue ({waitlistBookings.length})</span>
                <span className="text-[11px] text-[#64748B] font-normal">Managerial override requires mandatory justification</span>
              </h3>

              {waitlistBookings.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs text-[#64748B]">
                  No reservations currently waitlisted. All active requests have been cleared.
                </div>
              ) : (
                <div className="space-y-3">
                  {waitlistBookings.map((b: any) => (
                    <div
                      key={b._id}
                      className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            #{b.queuePosition || 1} in Line
                          </span>
                          <span className="text-sm font-bold text-[#172033]">{b.resourceName}</span>
                          {b.monopolisationDetected && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Fair-Share Cooldown
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B]">
                          Borrower: <strong className="text-[#172033]">{b.userName || b.user?.name}</strong> • Date:{' '}
                          <span className="text-[#1769D2] font-semibold">{b.date} ({b.timeSlot})</span>
                        </p>
                        <p className="text-[11px] text-[#64748B]">
                          <strong className="text-[#172033]">Waitlist Rationale:</strong> {b.transparencyRationale || b.waitlistReason || 'High campus demand.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedOverrideBooking(b)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Manager Override</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Scheduling conflict resolution */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#172033]">Scheduling Conflict Resolution Engine</h2>
            <span className="text-xs text-[#64748B]">{conflicts.length} collision cases detected</span>
          </div>

          {conflicts.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#172033]">No scheduling conflicts</h3>
              <p className="text-xs text-[#64748B] mt-1">All resource bookings are temporally isolated.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conflicts.map((c, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Collision Detected: {c.resource?.name}
                    </span>
                    <span className="text-xs text-[#64748B]">Timeslot Overlap</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Booking */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-2">
                      <span className="text-[11px] font-bold uppercase text-emerald-700">Candidate A</span>
                      <p className="text-sm font-bold text-[#172033]">{c.bookingA?.user?.name || 'Borrower A'}</p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(c.bookingA?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(c.bookingA?.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <button
                        onClick={() => handleResolveConflict(c.bookingA?._id, c.bookingB?._id)}
                        disabled={actionLoading}
                        className="w-full mt-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Confirm Candidate A (Waitlist Candidate B)
                      </button>
                    </div>

                    {/* Conflicting Booking */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-[#E2E8F0] space-y-2">
                      <span className="text-[11px] font-bold uppercase text-indigo-700">Candidate B</span>
                      <p className="text-sm font-bold text-[#172033]">{c.bookingB?.user?.name || 'Borrower B'}</p>
                      <p className="text-xs text-[#64748B]">
                        {new Date(c.bookingB?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(c.bookingB?.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <button
                        onClick={() => handleResolveConflict(c.bookingB?._id, c.bookingA?._id)}
                        disabled={actionLoading}
                        className="w-full mt-2 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold"
                      >
                        Confirm Candidate B (Waitlist Candidate A)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 7: Incident review */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#172033]">Campus Safety & Incident Review</h2>
            <span className="text-xs text-[#64748B]">{incidents.length} total logged events</span>
          </div>

          {incidents.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#172033]">No safety violations logged</h3>
              <p className="text-xs text-[#64748B] mt-1">Campus EH&S safety record is pristine.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((inc) => (
                <div
                  key={inc._id}
                  className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                        {inc.severity} Severity
                      </span>
                      <span className="text-xs font-bold text-[#172033]">{inc.title}</span>
                    </div>
                    <span className="text-xs text-[#64748B]">{new Date(inc.createdAt).toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-[#64748B]">{inc.description}</p>
                  <div className="text-xs text-[#64748B]">
                    Resource: <strong className="text-[#172033]">{inc.resource?.name}</strong> • Reported By:{' '}
                    <strong className="text-[#172033]">{inc.reportedBy?.name}</strong>
                  </div>

                  {inc.actionTaken && (
                    <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-emerald-700 border border-emerald-200">
                      <strong>Immediate Containment:</strong> {inc.actionTaken}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        setSelectedAiIncident({
                          incidentId: inc._id,
                          description: inc.description,
                          category: inc.category || 'equipment_damage',
                          resourceName: inc.resource?.name || inc.resourceName || 'Institutional Equipment',
                          reportedBy: inc.reportedBy?.name || inc.reportedBy || 'Student Researcher',
                          severity: inc.severity || 'medium',
                          evidence: inc.evidence || [],
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      AI Review Assistant
                    </button>

                    {inc.status !== 'resolved' ? (
                      <button
                        onClick={() => handleUpdateIncident(inc._id, 'resolved')}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                      >
                        Mark Sanction Resolved
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold">✓ Incident Closed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 8: Dispute management */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#172033]">Dispute Arbitration & Resolution Tribunal</h2>
            <span className="text-xs text-[#64748B]">
              {disputes.filter((d) => d.status === 'open').length} active claims
            </span>
          </div>

          {disputes.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#E2E8F0] bg-white">
              <Scale className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
              <h3 className="text-base font-semibold text-[#172033]">No active disputes</h3>
              <p className="text-xs text-[#64748B] mt-1">There are no pending arbitration claims.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((d) => (
                <div
                  key={d._id}
                  className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-4 shadow-sm"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-amber-600" /> Claim ID: #{d._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#64748B] space-y-1">
                    <p className="font-semibold text-[#172033]">{d.reason || 'Equipment Condition Dispute'}</p>
                    <p className="text-[#64748B]">{d.description}</p>
                  </div>

                  {d.resolution && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-emerald-200 text-xs text-emerald-800">
                      <strong>Binding Manager Ruling:</strong> {d.resolution}
                    </div>
                  )}

                  {d.status === 'open' && (
                    <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                      <textarea
                        rows={2}
                        value={selectedDisputeId === d._id ? disputeResolutionText : ''}
                        onChange={(e) => {
                          setSelectedDisputeId(d._id);
                          setDisputeResolutionText(e.target.value);
                        }}
                        placeholder="Enter binding arbitration ruling (e.g. Deposit refunded, calibration fee waived)..."
                        className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2]"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleResolveDispute(d._id)}
                          disabled={actionLoading || !disputeResolutionText.trim()}
                          className="px-4 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                        >
                          Submit Binding Ruling
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 9: Fair allocation settings */}
      {activeTab === 'fair-allocation' && (
        <form onSubmit={handleSaveFairAllocation} className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-[#172033]">Institution-Wide Fair Allocation Settings</h2>
            <p className="text-xs text-[#64748B] mt-1">
              Prevent resource hogging by establishing automated booking quotas and peak-hour caps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] space-y-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Max Booking Hours / Week / User
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={fairAllocation.maxHoursPerWeekPerUser || 12}
                  onChange={(e) =>
                    setFairAllocation({
                      ...fairAllocation,
                      maxHoursPerWeekPerUser: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Enforces equitable access for all researchers.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Max Active Simultaneous Reservations
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={fairAllocation.maxActiveBookingsPerUser || 3}
                  onChange={(e) =>
                    setFairAllocation({
                      ...fairAllocation,
                      maxActiveBookingsPerUser: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Prevents bulk reservation hoarding.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[#E2E8F0]">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Peak Hours Start</label>
                <input
                  type="time"
                  value={fairAllocation.peakHoursStart || '10:00'}
                  onChange={(e) =>
                    setFairAllocation({
                      ...fairAllocation,
                      peakHoursStart: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">Peak Hours End</label>
                <input
                  type="time"
                  value={fairAllocation.peakHoursEnd || '16:00'}
                  onChange={(e) =>
                    setFairAllocation({
                      ...fairAllocation,
                      peakHoursEnd: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-[#1769D2]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fairAllocation.allowCrossInstitution}
                  onChange={(e) =>
                    setFairAllocation({
                      ...fairAllocation,
                      allowCrossInstitution: e.target.checked,
                    })
                  }
                  className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                />
                <span className="text-xs text-[#172033]">
                  Allow cross-institutional resource sharing (Inter-campus collaboration)
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fairAllocation.prioritizeUnderrepresentedDepts}
                  onChange={(e) =>
                    setFairAllocation({
                      ...fairAllocation,
                      prioritizeUnderrepresentedDepts: e.target.checked,
                    })
                  }
                  className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                />
                <span className="text-xs text-[#172033]">
                  Prioritize underrepresented departments on high-demand waitlists
                </span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1769D2] hover:bg-[#1256B0] text-white font-medium shadow-sm text-sm transition-all"
              >
                <Save className="w-4 h-4" />
                Save Fair Allocation Rules
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 10: Immutable Audit Ledger */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <AuditLedgerViewer />
        </div>
      )}

      {/* Manager Override Modal */}
      {selectedOverrideBooking && (
        <ManagerOverrideModal
          isOpen={!!selectedOverrideBooking}
          booking={selectedOverrideBooking}
          onClose={() => setSelectedOverrideBooking(null)}
          onSuccess={async () => {
            showToast('Manager override applied successfully and committed to permanent ledger.');
            await fetchAllData();
          }}
        />
      )}

      {/* AI Incident Summary Assistant Modal */}
      {selectedAiIncident && (
        <IncidentSummaryModal
          isOpen={!!selectedAiIncident}
          incidentData={selectedAiIncident}
          onClose={() => setSelectedAiIncident(null)}
        />
      )}
    </div>
  );
};

export default ManagerDashboardPage;
