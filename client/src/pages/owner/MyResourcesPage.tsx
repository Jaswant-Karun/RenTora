import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getOwnerResourcesApi, deleteOwnerResourceApi } from '../../api/owner.api';
import { Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
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
} from 'lucide-react';

export const MyResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'maintenance' | 'in-use'>('all');

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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to decommission and remove "${name}"?`)) return;
    try {
      await deleteOwnerResourceApi(id);
      await fetchResources();
    } catch (err) {
      console.error('Error deleting resource:', err);
    }
  };

  const filtered = resources.filter((res) => {
    const matchesSearch =
      res.name.toLowerCase().includes(search.toLowerCase()) ||
      res.category.toLowerCase().includes(search.toLowerCase()) ||
      res.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-[#1769D2]" />
            My Resources & Facilities
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Manage your registered campus assets, view telemetry, and configure booking parameters.
          </p>
        </div>
        <Link
          to="/owner/add-resource"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-semibold shadow-sm transition-all"
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

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-[#64748B] flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>
          {(['all', 'available', 'maintenance', 'in-use'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
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
                  <h3 className="text-sm font-bold text-[#172033] group-hover:text-[#1769D2] transition-colors line-clamp-1">
                    {res.name}
                  </h3>
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
                  </div>

                  {/* Badges / specifications preview */}
                  <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex flex-wrap gap-1.5">
                    {res.approvalRequired && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200">
                        <ShieldAlert className="w-3 h-3" /> Approval Req
                      </span>
                    )}
                    {res.supervisionRequirement && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1769D2] border border-[#1769D2]/20">
                        Supervised
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]">
                      {res.minBookingDuration || 1}h - {res.maxBookingDuration || 8}h
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                  <Link
                    to={`/dashboard/resources/${res._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1769D2] hover:text-[#1256B0] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Borrower View
                  </Link>

                  <button
                    onClick={() => handleDelete(res._id, res.name)}
                    className="inline-flex items-center gap-1 text-xs text-[#DC2626] hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    title="Decommission Resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Decommission
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyResourcesPage;
