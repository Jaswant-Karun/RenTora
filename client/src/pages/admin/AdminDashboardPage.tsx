import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Users,
  Building,
  Layers,
  Calendar,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit,
  Save,
  Plus,
  Settings,
  History,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  getAdminOverviewApi,
  getAdminUsersApi,
  updateAdminUserRoleApi,
  deleteAdminUserApi,
  getAdminResourcesApi,
  updateAdminResourceApi,
  deleteAdminResourceApi,
  getAdminInstitutionsApi,
  createAdminInstitutionApi,
  getAdminSettingsApi,
  updateAdminSettingsApi,
  AdminStatsData,
  AdminUserItem,
  AdminInstitutionItem,
  SystemSettingsData,
} from '../../api/admin.api';
import { Resource } from '../../types/resource';
import { AuditLedgerViewer } from '../../components/manager/AuditLedgerViewer';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { StatCardSkeleton, TableRowSkeleton } from '../../components/common/SkeletonLoader';
import { ALL_CATEGORIES } from '../ExploreResourcesPage';

type AdminTab = 'overview' | 'users' | 'resources' | 'institutions' | 'audit' | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Overview Data
  const [stats, setStats] = useState<AdminStatsData | null>(null);
  const [institutionSummary, setInstitutionSummary] = useState<string[]>([]);

  // Users Data
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [userLoading, setUserLoading] = useState(false);

  // Resources Data
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('All');
  const [resourceLoading, setResourceLoading] = useState(false);

  // Institutions Data
  const [institutions, setInstitutions] = useState<AdminInstitutionItem[]>([]);
  const [newInstModalOpen, setNewInstModalOpen] = useState(false);
  const [newInstForm, setNewInstForm] = useState({
    name: '',
    code: '',
    domain: '',
    campusLocation: '',
    contactEmail: '',
    partnershipTier: 'Tier 1 Research',
  });

  // Settings Data
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Confirmation Modals State
  const [deleteUserModal, setDeleteUserModal] = useState<{ isOpen: boolean; user: AdminUserItem | null }>({
    isOpen: false,
    user: null,
  });
  const [deleteResourceModal, setDeleteResourceModal] = useState<{ isOpen: boolean; resource: Resource | null }>({
    isOpen: false,
    resource: null,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch Overview
  const fetchOverview = async () => {
    try {
      const res = await getAdminOverviewApi();
      if (res.success) {
        setStats(res.data.stats);
        setInstitutionSummary(res.data.institutionsSummary);
      }
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    }
  };

  // Fetch Users
  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await getAdminUsersApi({
        search: userSearch || undefined,
        role: userRoleFilter !== 'All' ? userRoleFilter : undefined,
      });
      if (res.success) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUserLoading(false);
    }
  };

  // Fetch Resources
  const fetchResources = async () => {
    setResourceLoading(true);
    try {
      const res = await getAdminResourcesApi({
        search: resourceSearch || undefined,
        category: resourceCategoryFilter !== 'All' ? resourceCategoryFilter : undefined,
      });
      if (res.success) {
        setResources(res.data);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    } finally {
      setResourceLoading(false);
    }
  };

  // Fetch Institutions
  const fetchInstitutions = async () => {
    try {
      const res = await getAdminInstitutionsApi();
      if (res.success) {
        setInstitutions(res.data);
      }
    } catch (err) {
      console.error('Error fetching institutions:', err);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await getAdminSettingsApi();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchUsers(), fetchResources(), fetchInstitutions(), fetchSettings()]);
      setLoading(false);
    };
    init();
  }, []);

  // Handle User Role Change
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await updateAdminUserRoleApi(userId, { role: newRole });
      if (res.success) {
        showToast(res.message);
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  // Handle User Status Toggle
  const handleToggleUserVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await updateAdminUserRoleApi(userId, { isVerified: !currentStatus });
      if (res.success) {
        showToast(`User verification toggled to ${!currentStatus ? 'VERIFIED' : 'UNVERIFIED'}`);
        fetchUsers();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async () => {
    if (!deleteUserModal.user) return;
    try {
      const res = await deleteAdminUserApi(deleteUserModal.user._id);
      if (res.success) {
        showToast(res.message);
        setDeleteUserModal({ isOpen: false, user: null });
        fetchUsers();
        fetchOverview();
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  // Handle Delete Resource
  const handleDeleteResource = async () => {
    if (!deleteResourceModal.resource) return;
    try {
      const res = await deleteAdminResourceApi(deleteResourceModal.resource._id);
      if (res.success) {
        showToast(res.message);
        setDeleteResourceModal({ isOpen: false, resource: null });
        fetchResources();
        fetchOverview();
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
  };

  // Handle Create Institution
  const handleCreateInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createAdminInstitutionApi(newInstForm);
      if (res.success) {
        showToast(res.message);
        setNewInstModalOpen(false);
        setNewInstForm({
          name: '',
          code: '',
          domain: '',
          campusLocation: '',
          contactEmail: '',
          partnershipTier: 'Tier 1 Research',
        });
        fetchInstitutions();
        fetchOverview();
      }
    } catch (err) {
      console.error('Error creating institution:', err);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await updateAdminSettingsApi(settings);
      if (res.success) {
        showToast('System configuration committed to permanent ledger.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const navTabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Platform Overview', icon: TrendingUp },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'resources', label: 'Resource Governance', icon: Layers },
    { id: 'institutions', label: 'Institution Federation', icon: Building },
    { id: 'audit', label: 'Immutable Audit Trail', icon: History },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            System Administration Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            RENTORA Global Administrative Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Multi-institutional federated resource management, user access control, audit verification, and platform parameters.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading || !stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Total Users</span>
                  <Users className="w-4 h-4 text-brand-400" />
                </span>
                <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
                <p className="text-[11px] text-slate-400">Enrolled researchers & faculty</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Partner Institutions</span>
                  <Building className="w-4 h-4 text-indigo-400" />
                </span>
                <p className="text-3xl font-black text-indigo-300">{stats.totalInstitutions}</p>
                <p className="text-[11px] text-slate-400">Federated universities in consortium</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Catalog Assets</span>
                  <Layers className="w-4 h-4 text-purple-400" />
                </span>
                <p className="text-3xl font-black text-purple-300">{stats.totalResources}</p>
                <p className="text-[11px] text-slate-400">Laboratories, tools & compute clusters</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Total Bookings</span>
                  <Calendar className="w-4 h-4 text-teal-400" />
                </span>
                <p className="text-3xl font-black text-teal-300">{stats.totalBookings}</p>
                <p className="text-[11px] text-slate-400">Lifetime research sessions</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Pending Approvals</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </span>
                <p className="text-3xl font-black text-amber-300">{stats.pendingApprovals}</p>
                <p className="text-[11px] text-slate-400">Awaiting custodian clearance</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Active Incidents</span>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                </span>
                <p className="text-3xl font-black text-rose-300">{stats.activeIncidents}</p>
                <p className="text-[11px] text-slate-400">Unresolved safety tickets</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-1 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Overall Resource Utilization</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </span>
                <p className="text-3xl font-black text-emerald-300">{stats.resourceUtilization}</p>
                <p className="text-[11px] text-slate-400">Real-time facility capacity load across all partner campuses</p>
              </div>
            </div>
          )}

          {/* Federated Institution Summary */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-400" />
              Connected Partner Institutions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {institutionSummary.map((instName, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <h4 className="text-xs font-bold text-white">{instName}</h4>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Federated Node
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user by name, email, or department..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setTimeout(fetchUsers, 50);
                }}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="owner">Owner / Custodian</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>

              <button
                onClick={fetchUsers}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                title="Refresh users"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-semibold text-[11px]">
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Institution / Department</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {userLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-brand-300 focus:outline-none"
                          >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                            <option value="owner">Owner</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-white">{u.institution}</p>
                          <p className="text-[11px] text-slate-400">{u.department || 'General'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleUserVerification(u._id, u.isVerified)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                              u.isVerified
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {u.isVerified ? 'Verified' : 'Pending Verification'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setDeleteUserModal({ isOpen: true, user: u })}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESOURCE GOVERNANCE */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search equipment by name, custodian, or location..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchResources()}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={resourceCategoryFilter}
                onChange={(e) => {
                  setResourceCategoryFilter(e.target.value);
                  setTimeout(fetchResources, 50);
                }}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Categories</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchResources}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                title="Refresh catalog"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-semibold text-[11px]">
                    <th className="py-3.5 px-4">Equipment</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Location</th>
                    <th className="py-3.5 px-4">Operational Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {resourceLoading ? (
                    Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                  ) : resources.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No equipment records match filter.
                      </td>
                    </tr>
                  ) : (
                    resources.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-white">{r.name}</p>
                          <p className="text-[11px] text-slate-400">{r.ownerName} ({r.ownerDepartment})</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {r.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{r.location}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={r.status}
                            onChange={async (e) => {
                              await updateAdminResourceApi(r._id, { status: e.target.value });
                              showToast(`Resource status set to ${e.target.value}`);
                              fetchResources();
                            }}
                            className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:outline-none"
                          >
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="in_use">In Use</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setDeleteResourceModal({ isOpen: true, resource: r })}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Decommission Equipment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INSTITUTION MANAGEMENT */}
      {activeTab === 'institutions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-white">Federated Institution Registry</h2>
              <p className="text-xs text-slate-400">
                Authorized university campuses participating in mutual asset sharing consortium.
              </p>
            </div>
            <button
              onClick={() => setNewInstModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Onboard Partner Campus
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {institutions.map((inst) => (
              <div
                key={inst._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/30">
                      {inst.code}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1.5">{inst.name}</h3>
                    <p className="text-xs text-slate-400">{inst.campusLocation}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {inst.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Tier</span>
                    <p className="font-semibold text-slate-300">{inst.partnershipTier}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Domain</span>
                    <p className="font-semibold text-slate-300">@{inst.domain}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: IMMUTABLE AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <AuditLedgerViewer />
        </div>
      )}

      {/* TAB 6: SYSTEM SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Platform Parameters & Operational Controls</h2>
              <p className="text-xs text-slate-400">
                Institutional policies governing quotas, maintenance mode, and ledger integrity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Platform Brand Name</label>
                <input
                  type="text"
                  value={settings.platformName}
                  onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Max Active Reservations Per User
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.maxActiveBookingsPerUser}
                  onChange={(e) =>
                    setSettings({ ...settings, maxActiveBookingsPerUser: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Monopolisation Cooldown Window (Days)
                </label>
                <input
                  type="number"
                  min={7}
                  max={60}
                  value={settings.monopolisationWindowDays}
                  onChange={(e) =>
                    setSettings({ ...settings, monopolisationWindowDays: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Emergency Maintenance Mode</p>
                  <p className="text-[11px] text-slate-400">
                    Temporarily halts new reservations while preserving existing checkouts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-white">Public Student & Faculty Registration</p>
                  <p className="text-[11px] text-slate-400">
                    Allows academic members to self-register with institutional verification.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowPublicRegistration}
                  onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-brand-500/25 text-xs transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Committing...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Onboard Institution Modal */}
      {newInstModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Onboard Partner University Campus</h3>
              <button onClick={() => setNewInstModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInstitution} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Institution Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Institute of Technology Bombay"
                  value={newInstForm.name}
                  onChange={(e) => setNewInstForm({ ...newInstForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Campus Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IIT-B"
                    value={newInstForm.code}
                    onChange={(e) => setNewInstForm({ ...newInstForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Campus Email Domain</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iitb.ac.in"
                    value={newInstForm.domain}
                    onChange={(e) => setNewInstForm({ ...newInstForm, domain: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Campus Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Powai, Mumbai, Maharashtra"
                  value={newInstForm.campusLocation}
                  onChange={(e) => setNewInstForm({ ...newInstForm, campusLocation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewInstModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 rounded-xl text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-semibold text-white"
                >
                  Register Campus
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteUserModal.isOpen}
        title="Purge User Account"
        message={`Are you sure you want to permanently remove ${deleteUserModal.user?.name} (${deleteUserModal.user?.email}) from the platform? This action cannot be reversed.`}
        confirmLabel="Purge Account"
        confirmVariant="danger"
        onConfirm={handleDeleteUser}
        onClose={() => setDeleteUserModal({ isOpen: false, user: null })}
      />

      {/* Delete Resource Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteResourceModal.isOpen}
        title="Decommission Campus Equipment"
        message={`Are you sure you want to permanently decommission "${deleteResourceModal.resource?.name}"? All future availability will be canceled.`}
        confirmLabel="Decommission Asset"
        confirmVariant="danger"
        onConfirm={handleDeleteResource}
        onClose={() => setDeleteResourceModal({ isOpen: false, resource: null })}
      />
    </div>
  );
};

export default AdminDashboardPage;
