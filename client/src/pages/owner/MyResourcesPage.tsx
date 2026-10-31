import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOwnerResourcesApi, deleteOwnerResourceApi, updateOwnerResourceApi } from '../../api/owner.api';
import { Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Cpu,
  PlusCircle,
  Trash2,
  ExternalLink,
  MapPin,
  Building,
  ShieldAlert,
  Search,
  Filter,
  Edit,
  Power,
  X,
  Check,
  Save,
  Clock,
  Layers,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';

const CATEGORIES = [
  'Laboratories',
  'Classrooms',
  'Meeting Rooms',
  'Computers',
  'Cameras',
  '3D Printers',
  'Electronics Equipment',
  'Testing Instruments',
  'Workshop Tools',
  'Other Resources',
];

export const MyResourcesPage: React.FC = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'maintenance' | 'in_use' | 'disabled' | 'archived'>('all');

  // Edit Modal State
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await getOwnerResourcesApi();
      if (res.success) {
        setResources(res.data);
      }
    } catch (err) {
      console.error('Error fetching owner resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setEditForm({
      name: res.name || '',
      category: res.category || 'Laboratories',
      description: res.description || '',
      location: res.location || '',
      images: res.images && res.images.length > 0 ? [...res.images] : [],
      availabilitySchedule: res.availabilitySchedule || 'Monday - Friday (09:00 - 18:00)',
      minBookingDuration: res.minBookingDuration || '1 hour',
      maxBookingDuration: res.maxBookingDuration || '4 hours',
      eligibility: res.eligibility || 'All Enrolled Students & Faculty',
      trainingRequired: res.trainingRequired || 'Basic Lab Safety Induction',
      supervisionRequirement: res.supervisionRequirement || 'Self-Operated after training clearance',
      depositConditions: res.depositConditions || 'None',
      status: res.status || 'available',
      approvalRequired: res.approvalRequired !== undefined ? res.approvalRequired : true,
    });
    setNewImageUrl('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource) return;
    setSaving(true);
    try {
      const res = await updateOwnerResourceApi(editingResource._id, editForm);
      if (res.success) {
        toast.success(`Resource "${res.data.name}" updated successfully.`);
        setEditingResource(null);
        await fetchResources();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update resource.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (res: Resource, nextStatus: 'available' | 'maintenance' | 'disabled') => {
    try {
      await updateOwnerResourceApi(res._id, { status: nextStatus });
      toast.success(`Status of "${res.name}" updated to ${nextStatus.toUpperCase()}.`);
      await fetchResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error updating resource status.');
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to archive "${name}"?\n\nThis will remove it from discovery, while ALL historical booking logs, receipts, and audit trails remain preserved permanently.`)) {
      return;
    }
    try {
      const res = await deleteOwnerResourceApi(id);
      toast.success(res.message || `"${name}" archived successfully. Historical bookings preserved.`);
      await fetchResources();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to archive resource.');
    }
  };

  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.category.toLowerCase().includes(search.toLowerCase()) ||
      res.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all'
        ? !res.isArchived && res.status !== 'archived'
        : statusFilter === 'archived'
        ? res.isArchived || res.status === 'archived'
        : res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-[#1769D2]" />
            Resource Catalogue & Facility Management
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Configure lab schedules, operating hours, usage limits, eligibility criteria, and maintenance states.
          </p>
        </div>
        <Link
          to="/owner/add-resource"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Resource
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, category, lab location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:border-[#1769D2] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#64748B] flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {(['all', 'available', 'maintenance', 'disabled', 'archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-[#1769D2] text-white shadow-sm'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Querying registered equipment..." size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[#172033]">No resources found</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'No assets match your search and filter criteria.'
              : 'You have not listed any resources yet. Get started by registering your first lab or equipment.'}
          </p>
          <div className="mt-4">
            <Link
              to="/owner/add-resource"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 text-xs font-semibold hover:bg-blue-100"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Resource Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((res) => (
            <motion.div
              key={res._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden flex flex-col hover:shadow-md transition-all duration-200 group shadow-sm"
            >
              {/* Image banner */}
              <div className="h-44 relative overflow-hidden bg-slate-100">
                <img
                  src={
                    res.images?.[0] ||
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop'
                  }
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-white/90 text-[#1769D2] border border-[#E2E8F0] shadow-sm">
                    {res.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                      res.status === 'available'
                        ? 'bg-emerald-50 text-[#16834A] border border-emerald-200'
                        : res.status === 'maintenance'
                        ? 'bg-amber-50 text-[#D97706] border border-amber-200'
                        : res.status === 'disabled'
                        ? 'bg-red-50 text-[#DC2626] border border-red-200'
                        : res.status === 'archived'
                        ? 'bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#172033] group-hover:text-[#1769D2] transition-colors line-clamp-1">
                      {res.name}
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{res.description}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-[#64748B]">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="truncate">{res.institution}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="truncate">{res.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                      <span className="truncate">{res.availabilitySchedule || 'Mon - Fri (09:00 - 18:00)'}</span>
                    </div>
                  </div>

                  {/* Badges / specifications preview */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-wrap gap-1.5">
                    {res.approvalRequired && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                        <ShieldAlert className="w-3 h-3" /> Approval Req
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
                      Duration: {res.minBookingDuration || '1h'} - {res.maxBookingDuration || '4h'}
                    </span>
                    {res.trainingRequired && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20 truncate max-w-[180px]">
                        Training: {res.trainingRequired}
                      </span>
                    )}
                  </div>
                </div>

                {/* State Controls and Card Actions */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  {/* Quick state toggles */}
                  <div className="flex items-center justify-between text-[11px] gap-1">
                    <span className="text-[#64748B]">Quick State:</span>
                    <div className="flex items-center gap-1">
                      {res.status !== 'available' && (
                        <button
                          onClick={() => handleToggleStatus(res, 'available')}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-[#16834A] border border-emerald-200 hover:bg-emerald-100 font-medium"
                          title="Set Available"
                        >
                          Enable
                        </button>
                      )}
                      {res.status !== 'maintenance' && (
                        <button
                          onClick={() => handleToggleStatus(res, 'maintenance')}
                          className="px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200 hover:bg-amber-100 font-medium"
                          title="Set Maintenance"
                        >
                          Maintenance
                        </button>
                      )}
                      {res.status !== 'disabled' && (
                        <button
                          onClick={() => handleToggleStatus(res, 'disabled')}
                          className="px-2 py-0.5 rounded bg-red-50 text-[#DC2626] border border-red-200 hover:bg-red-100 font-medium"
                          title="Temporarily Disable"
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Primary Card Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(res)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#EFF6FF] text-[#1769D2] hover:bg-blue-100 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <Link
                        to={`/dashboard/resources/${res._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#172033] px-2 py-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Preview
                      </Link>
                    </div>

                    <button
                      onClick={() => handleArchive(res._id, res.name)}
                      className="inline-flex items-center gap-1 text-xs text-[#DC2626] hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors font-medium"
                      title="Archive resource while keeping historical bookings"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Resource Modal */}
      <AnimatePresence>
        {editingResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#E2E8F0] space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1769D2] flex items-center justify-center">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#172033]">Edit Resource Configuration</h3>
                    <p className="text-xs text-[#64748B]">Update equipment parameters, operating hours, and requirements</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingResource(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-[#64748B]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                {/* Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Resource Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Category *</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none bg-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-[#172033]">Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none resize-none"
                  />
                </div>

                {/* Location & Operating Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Location (Room / Building) *</label>
                    <input
                      type="text"
                      required
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Operating Hours / Availability *</label>
                    <input
                      type="text"
                      value={editForm.availabilitySchedule}
                      onChange={(e) => setEditForm({ ...editForm, availabilitySchedule: e.target.value })}
                      placeholder="e.g. Monday - Friday (09:00 - 18:00)"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Booking Duration Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Min Booking Duration</label>
                    <input
                      type="text"
                      value={editForm.minBookingDuration}
                      onChange={(e) => setEditForm({ ...editForm, minBookingDuration: e.target.value })}
                      placeholder="e.g. 1 hour"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Max Booking Duration (Usage Limit)</label>
                    <input
                      type="text"
                      value={editForm.maxBookingDuration}
                      onChange={(e) => setEditForm({ ...editForm, maxBookingDuration: e.target.value })}
                      placeholder="e.g. 4 hours"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Eligibility & Training Requirements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Eligibility Requirements</label>
                    <input
                      type="text"
                      value={editForm.eligibility}
                      onChange={(e) => setEditForm({ ...editForm, eligibility: e.target.value })}
                      placeholder="e.g. Enrolled Scholars & Faculty"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Training / Certification Requirement</label>
                    <input
                      type="text"
                      value={editForm.trainingRequired}
                      onChange={(e) => setEditForm({ ...editForm, trainingRequired: e.target.value })}
                      placeholder="e.g. Basic Lab Safety Induction"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Usage Conditions & Supervision */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Supervision Requirement</label>
                    <input
                      type="text"
                      value={editForm.supervisionRequirement}
                      onChange={(e) => setEditForm({ ...editForm, supervisionRequirement: e.target.value })}
                      placeholder="e.g. Self-Operated after training clearance"
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-[#172033]">Operational Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#E2E8F0] focus:border-[#1769D2] focus:outline-none bg-white font-medium"
                    >
                      <option value="available">Available for Bookings</option>
                      <option value="maintenance">Under Maintenance</option>
                      <option value="disabled">Temporarily Disabled</option>
                    </select>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                  <label className="font-semibold text-[#172033] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#1769D2]" />
                    Resource Images ({editForm.images?.length || 0})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Add image URL (https://...)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs focus:border-[#1769D2] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newImageUrl.trim()) {
                          setEditForm({ ...editForm, images: [...(editForm.images || []), newImageUrl.trim()] });
                          setNewImageUrl('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] text-[#1769D2] font-semibold text-xs border border-[#1769D2]/20"
                    >
                      Add URL
                    </button>
                  </div>

                  {editForm.images && editForm.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {editForm.images.map((img: string, idx: number) => (
                        <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-[#E2E8F0]">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editForm.images.filter((_: any, i: number) => i !== idx);
                              setEditForm({ ...editForm, images: updated });
                            }}
                            className="absolute top-1 right-1 p-0.5 rounded bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approval Checkbox */}
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editApproval"
                    checked={editForm.approvalRequired}
                    onChange={(e) => setEditForm({ ...editForm, approvalRequired: e.target.checked })}
                    className="rounded border-[#E2E8F0] text-[#1769D2] focus:ring-[#1769D2]"
                  />
                  <label htmlFor="editApproval" className="text-xs text-[#172033] font-medium">
                    Custodian approval mandatory before granting booking pass
                  </label>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingResource(null)}
                    className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyResourcesPage;

