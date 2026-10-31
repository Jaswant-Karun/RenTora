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
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  Sliders,
  CheckCircle,
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Cpu className="w-8 h-8 text-brand-400" />
            My Resources & Facilities
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your registered campus assets, view telemetry, and configure booking parameters.
          </p>
        </div>
        <Link
          to="/owner/add-resource"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-brand-500/20 text-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Resource
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, category, lab location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filter Status:
          </span>
          {(['all', 'available', 'maintenance', 'in-use'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
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
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No resources found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'No assets match your search and filter criteria.'
              : 'You have not listed any resources yet. Get started by registering your first lab or equipment.'}
          </p>
          <div className="mt-4">
            <Link
              to="/owner/add-resource"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 text-brand-300 text-xs font-medium hover:bg-slate-700"
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
              className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden flex flex-col hover:border-slate-700/80 transition-all duration-300 group shadow-lg"
            >
              {/* Image banner */}
              <div className="h-44 relative overflow-hidden bg-slate-950">
                <img
                  src={
                    res.images?.[0] ||
                    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop'
                  }
                  alt={res.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-brand-300 border border-brand-500/30">
                    {res.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      res.status === 'available'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : res.status === 'maintenance'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{res.description}</p>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{res.institution}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{res.location}</span>
                    </div>
                  </div>

                  {/* Badges / specifications preview */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                    {res.approvalRequired && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <ShieldAlert className="w-3 h-3" /> Approval Req
                      </span>
                    )}
                    {res.supervisionRequirement && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Supervised
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Duration: {res.minBookingDuration || 1}h - {res.maxBookingDuration || 8}h
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Link
                    to={`/dashboard/resources/${res._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Borrower View
                  </Link>

                  <button
                    onClick={() => handleDelete(res._id, res.name)}
                    className="inline-flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
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
