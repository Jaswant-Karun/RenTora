import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getResourcesApi } from '../../api/resource.api';
import { Resource, ResourceCategory } from '../../types/resource';
import { ResourceCard } from '../../components/resources/ResourceCard';
import { BookingModal } from '../../components/resources/BookingModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  Building,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Users,
  Camera,
  Printer,
  Radio,
  Gauge,
  Wrench,
  Boxes,
  Sparkles,
  LayoutGrid,
  List,
} from 'lucide-react';

export const ALL_CATEGORIES: { name: ResourceCategory; icon: any }[] = [
  { name: 'Laboratories', icon: Layers },
  { name: 'Classrooms', icon: GraduationCap },
  { name: 'Meeting Rooms', icon: Users },
  { name: 'Computers', icon: Cpu },
  { name: 'Cameras', icon: Camera },
  { name: '3D Printers', icon: Printer },
  { name: 'Electronics Equipment', icon: Radio },
  { name: 'Testing Instruments', icon: Gauge },
  { name: 'Workshop Tools', icon: Wrench },
  { name: 'Other Resources', icon: Boxes },
];

export const ExploreResourcesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search input state with debouncing
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  // Filters state
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedInstitution = searchParams.get('institution') || 'All';
  const selectedLocation = searchParams.get('location') || 'All';
  const selectedAvailability = searchParams.get('availability') || 'All';
  const selectedResourceType = searchParams.get('resourceType') || 'All';
  const selectedEligibility = searchParams.get('eligibility') || 'All';
  const selectedDate = searchParams.get('date') || '';

  // Data states
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState<{
    institutions: string[];
    locations: string[];
    categories: string[];
  }>({ institutions: [], locations: [], categories: [] });

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Booking modal
  const [selectedForBooking, setSelectedForBooking] = useState<Resource | null>(null);

  // Search input debounce handler
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput.trim()) {
        searchParams.set('search', searchInput.trim());
      } else {
        searchParams.delete('search');
      }
      setSearchParams(searchParams, { replace: true });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch resources from MongoDB whenever parameters change
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await getResourcesApi({
          search: debouncedSearch || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          institution: selectedInstitution !== 'All' ? selectedInstitution : undefined,
          location: selectedLocation !== 'All' ? selectedLocation : undefined,
          availability: selectedAvailability !== 'All' ? selectedAvailability : undefined,
          resourceType: selectedResourceType !== 'All' ? selectedResourceType : undefined,
          eligibility: selectedEligibility !== 'All' ? selectedEligibility : undefined,
          date: selectedDate || undefined,
          limit: 30,
        });

        if (res.success) {
          setResources(res.data);
          setTotalCount(res.meta.total);
          if (res.meta.filterOptions) {
            setFilterOptions(res.meta.filterOptions);
          }
        }
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [
    debouncedSearch,
    selectedCategory,
    selectedInstitution,
    selectedLocation,
    selectedAvailability,
    selectedResourceType,
    selectedEligibility,
    selectedDate,
  ]);

  const updateFilter = (key: string, value: string) => {
    if (value === 'All' || !value) {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSearchParams({}, { replace: true });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedInstitution !== 'All') count++;
    if (selectedLocation !== 'All') count++;
    if (selectedAvailability !== 'All') count++;
    if (selectedResourceType !== 'All') count++;
    if (selectedEligibility !== 'All') count++;
    if (selectedDate) count++;
    if (debouncedSearch) count++;
    return count;
  }, [
    selectedCategory,
    selectedInstitution,
    selectedLocation,
    selectedAvailability,
    selectedResourceType,
    selectedEligibility,
    selectedDate,
    debouncedSearch,
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-300 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            Institutional Resource Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Explore Campus Resources & High-Value Equipment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Search and reserve cleanrooms, electron microscopes, HPC clusters, and specialized labs across partner universities.
          </p>
        </div>

        {/* Live count badge */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-right shrink-0">
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Federated Catalog</p>
          <p className="text-2xl font-extrabold text-white mt-0.5">{totalCount} Assets</p>
          <span className="text-[11px] text-emerald-400 flex items-center justify-end gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Live in MongoDB
          </span>
        </div>
      </div>

      {/* Category Pills (All 10 Categories) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Filter by Category
          </span>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => updateFilter('category', 'All')}
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Show all categories
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => updateFilter('category', 'All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedCategory === 'All'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25 border border-brand-500'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>All Categories</span>
          </button>

          {ALL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => updateFilter('category', cat.name)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/25 border border-brand-500'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        {/* Top search input row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by equipment name, keywords, model, institution, or specs (debounced)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl border border-slate-700/80 pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  viewMode === 'list' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Institution Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-500" />
              Institution
            </label>
            <select
              value={selectedInstitution}
              onChange={(e) => updateFilter('institution', e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Institutions</option>
              {filterOptions.institutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Campus Locations</option>
              {filterOptions.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-slate-500" />
              Availability
            </label>
            <select
              value={selectedAvailability}
              onChange={(e) => updateFilter('availability', e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Statuses</option>
              <option value="Available Now">Available Now</option>
              <option value="reserved">Reserved Slots</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* Resource Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-500" />
              Resource Type
            </label>
            <select
              value={selectedResourceType}
              onChange={(e) => updateFilter('resourceType', e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Types</option>
              <option value="Physical Space / Research Lab">Physical Space / Lab</option>
              <option value="High Performance Computing (HPC)">HPC / Supercomputer</option>
              <option value="High-Speed Scientific Camera">Scientific Camera</option>
              <option value="Additive Manufacturing System">3D Printer / Additive</option>
              <option value="RF & Signal Measurement">RF & Electronics</option>
              <option value="Mechanical Test System">Mechanical Tester</option>
              <option value="Subtractive Fabrication Machine">CNC / Machine Tool</option>
              <option value="Surveying & Geospatial Apparatus">Drone / Surveying</option>
            </select>
          </div>

          {/* Eligibility Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-500" />
              Eligibility
            </label>
            <select
              value={selectedEligibility}
              onChange={(e) => updateFilter('eligibility', e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Members</option>
              <option value="All Enrolled Students & Faculty">Enrolled Students & Faculty</option>
              <option value="Faculty">Faculty Only</option>
              <option value="Research Scholars">Research Scholars</option>
              <option value="Certified">Certified Operators Only</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              Desired Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => updateFilter('date', e.target.value)}
              className="w-full bg-slate-950 text-slate-200 rounded-xl border border-slate-700/80 p-2 text-xs focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Main Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{resources.length}</strong> of{' '}
            <strong className="text-white">{totalCount}</strong> matching resources
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <LoadingSpinner message="Querying federated MongoDB resource nodes..." size="lg" />
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No resources match your active filters</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search keywords, broadening category filters, or resetting filters to view all equipment.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onQuickBook={(res) => setSelectedForBooking(res)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => (
              <div
                key={resource._id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={resource.images?.[0]}
                    alt={resource.name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20">
                        {resource.category}
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">• {resource.status}</span>
                    </div>
                    <h3
                      onClick={() => navigate(`/dashboard/resources/${resource._id}`)}
                      className="text-sm font-bold text-white hover:text-brand-300 cursor-pointer"
                    >
                      {resource.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {resource.institution} — {resource.location}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Custodian: {resource.ownerName} • {resource.eligibility}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => navigate(`/dashboard/resources/${resource._id}`)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setSelectedForBooking(resource)}
                    className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
                  >
                    Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={!!selectedForBooking}
        resource={selectedForBooking}
        onClose={() => setSelectedForBooking(null)}
        onSuccess={() => {
          navigate('/dashboard/bookings');
        }}
      />
    </div>
  );
};

export default ExploreResourcesPage;
