import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getResourcesApi } from '../api/resource.api';
import { Resource, ResourceCategory } from '../types/resource';
import { ResourceCard } from '../components/resources/ResourceCard';
import { BookingModal } from '../components/resources/BookingModal';
import { SmartResourceMatcherModal } from '../components/ai/SmartResourceMatcherModal';
import { CardSkeleton } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import {
  Search,
  RotateCcw,
  Building,
  Calendar,
  Layers,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Award,
  ChevronDown,
  X,
  ArrowUpDown,
  Heart,
} from 'lucide-react';
import { getFavoriteResourceIds } from '../utils/favorites';

export const ALL_CATEGORIES: ResourceCategory[] = [
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
  const selectedTraining = searchParams.get('training') || 'All';
  const selectedDate = searchParams.get('date') || '';
  const selectedSort = searchParams.get('sort') || 'relevance';

  // Toggle advanced filter panel
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Data states
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState<{
    institutions: string[];
    locations: string[];
    categories: string[];
    resourceTypes?: string[];
    eligibilities?: string[];
  }>({
    institutions: [],
    locations: [],
    categories: [],
    resourceTypes: [],
    eligibilities: [],
  });

  // Booking modal & AI Smart Matcher modal
  const [selectedForBooking, setSelectedForBooking] = useState<Resource | null>(null);
  const [isSmartMatcherOpen, setIsSmartMatcherOpen] = useState(false);

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
    }, 300);

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
          training: selectedTraining !== 'All' ? selectedTraining : undefined,
          date: selectedDate || undefined,
          sort: selectedSort,
          limit: 36,
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
    selectedTraining,
    selectedDate,
    selectedSort,
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

  // Favorites state and synchronization
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(getFavoriteResourceIds());

  useEffect(() => {
    const handleFavoritesChanged = () => {
      setFavoriteIds(getFavoriteResourceIds());
    };
    window.addEventListener('rentora_favorites_changed', handleFavoritesChanged);
    return () => window.removeEventListener('rentora_favorites_changed', handleFavoritesChanged);
  }, []);

  const displayedResources = useMemo(() => {
    if (!onlyFavorites) return resources;
    return resources.filter((r) => favoriteIds.includes(r._id));
  }, [resources, onlyFavorites, favoriteIds]);

  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (selectedLocation !== 'All') count++;
    if (selectedResourceType !== 'All') count++;
    if (selectedEligibility !== 'All') count++;
    if (selectedTraining !== 'All') count++;
    if (selectedDate) count++;
    return count;
  }, [selectedLocation, selectedResourceType, selectedEligibility, selectedTraining, selectedDate]);

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedInstitution !== 'All' ||
    selectedLocation !== 'All' ||
    selectedAvailability !== 'All' ||
    selectedResourceType !== 'All' ||
    selectedEligibility !== 'All' ||
    selectedTraining !== 'All' ||
    Boolean(selectedDate) ||
    Boolean(debouncedSearch) ||
    onlyFavorites;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Institutional Resource Marketplace
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Discover, filter by eligibility and availability, and schedule state-of-the-art laboratory apparatus across partner universities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSmartMatcherOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#1769D2] text-xs font-semibold border border-blue-200 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>SmartMatch AI Discovery</span>
        </button>
      </div>

      {/* 2. Main Search & Filter Console */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3.5">
        {/* Primary Row: Search Input & Core Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Text Search (5 cols) */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by equipment name, specification, tag, model..."
              className="w-full bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] text-xs rounded-lg pl-9 pr-8 py-2.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2] transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Institution Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedInstitution}
              onChange={(e) => updateFilter('institution', e.target.value)}
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-2.5 py-2.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            >
              <option value="All">All Institutions</option>
              {filterOptions.institutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedAvailability}
              onChange={(e) => updateFilter('availability', e.target.value)}
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-2.5 py-2.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            >
              <option value="All">All Statuses</option>
              <option value="available">Available Now</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* Sort By Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={selectedSort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-2.5 py-2.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="popular">Sort: Popularity</option>
              <option value="availability">Sort: Available First</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="name_asc">Sort: Name (A - Z)</option>
              <option value="name_desc">Sort: Name (Z - A)</option>
            </select>
          </div>

          {/* Advanced Filter Toggle Button (1 col) */}
          <div className="lg:col-span-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`w-full h-full py-2 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border ${
                showAdvanced || activeAdvancedCount > 0
                  ? 'bg-[#EFF6FF] border-blue-300 text-[#1769D2]'
                  : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
              }`}
              title="Toggle Advanced Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeAdvancedCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1769D2] text-white text-[10px] flex items-center justify-center">
                  {activeAdvancedCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              onlyFavorites
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            <span>Saved Favorites ({favoriteIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOnlyFavorites(false);
              updateFilter('category', 'All');
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              !onlyFavorites && selectedCategory === 'All'
                ? 'bg-[#1769D2] text-white shadow-xs'
                : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
            }`}
          >
            All Categories
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => updateFilter('category', cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1769D2] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showAdvanced && (
          <div className="pt-3 pb-1 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-50/70 p-3.5 rounded-xl">
            {/* Campus / Lab Location */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                Campus Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="w-full bg-white text-[#172033] text-xs rounded-lg px-2.5 py-1.5 border border-[#E2E8F0] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Locations</option>
                {filterOptions.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                Resource Type
              </label>
              <select
                value={selectedResourceType}
                onChange={(e) => updateFilter('resourceType', e.target.value)}
                className="w-full bg-white text-[#172033] text-xs rounded-lg px-2.5 py-1.5 border border-[#E2E8F0] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Types</option>
                <option value="Laboratory">Laboratory Facility</option>
                <option value="Equipment">Analytical Equipment</option>
                <option value="Computational">Computational Cluster</option>
                <option value="Testing">Testing Instruments</option>
                <option value="Space">Research Space</option>
              </select>
            </div>

            {/* Borrower Eligibility */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                Borrower Eligibility
              </label>
              <select
                value={selectedEligibility}
                onChange={(e) => updateFilter('eligibility', e.target.value)}
                className="w-full bg-white text-[#172033] text-xs rounded-lg px-2.5 py-1.5 border border-[#E2E8F0] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Academic Levels</option>
                <option value="Undergraduate">Undergraduate Students</option>
                <option value="Graduate">Postgraduate / Masters</option>
                <option value="PhD Scholar">PhD Scholars & Researchers</option>
                <option value="Faculty">Faculty & Staff</option>
              </select>
            </div>

            {/* Training / Certification Requirements */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                Training Requirements
              </label>
              <select
                value={selectedTraining}
                onChange={(e) => updateFilter('training', e.target.value)}
                className="w-full bg-white text-[#172033] text-xs rounded-lg px-2.5 py-1.5 border border-[#E2E8F0] focus:outline-none focus:border-[#1769D2]"
              >
                <option value="All">All Conditions</option>
                <option value="none">No Training Required</option>
                <option value="required">Certification / SOP Required</option>
              </select>
            </div>

            {/* Required Date */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                Target Reservation Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => updateFilter('date', e.target.value)}
                className="w-full bg-white text-[#172033] text-xs rounded-lg px-2.5 py-1.5 border border-[#E2E8F0] focus:outline-none focus:border-[#1769D2]"
              />
            </div>
          </div>
        )}

        {/* Filter Summary & Active Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>
              Showing <strong className="text-[#172033]">{resources.length}</strong> of{' '}
              <strong className="text-[#172033]">{totalCount}</strong> assets
            </span>

            {/* Active Pill Badges */}
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1769D2] border border-blue-200 text-[11px]">
                Category: {selectedCategory}
                <button type="button" onClick={() => updateFilter('category', 'All')} className="hover:text-blue-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedInstitution !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EFF6FF] text-[#1769D2] border border-blue-200 text-[11px]">
                {selectedInstitution}
                <button type="button" onClick={() => updateFilter('institution', 'All')} className="hover:text-blue-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedAvailability !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#16834A] border border-emerald-200 text-[11px]">
                {selectedAvailability}
                <button type="button" onClick={() => updateFilter('availability', 'All')} className="hover:text-emerald-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTraining !== 'All' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-[#D97706] border border-amber-200 text-[11px]">
                Training: {selectedTraining}
                <button type="button" onClick={() => updateFilter('training', 'All')} className="hover:text-amber-800">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[#172033] border border-slate-300 text-[11px]">
                Date: {selectedDate}
                <button type="button" onClick={() => updateFilter('date', '')} className="hover:text-black">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-[#DC2626] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Resource Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : displayedResources.length === 0 ? (
        onlyFavorites ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center space-y-3">
            <Heart className="w-10 h-10 text-rose-300 mx-auto" />
            <h3 className="text-base font-bold text-[#172033]">No Saved Favorite Resources</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              You haven't bookmarked any research apparatus yet. Click the heart icon on any resource card to save equipment to your favorites list.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setOnlyFavorites(false)}
                className="px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium rounded-lg shadow-xs"
              >
                Browse All Equipment
              </button>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No resources matched your filter parameters"
            description="Try broadening your category filters, clearing the target date, or searching for a different apparatus."
            actionLabel="Clear all filters"
            onAction={handleResetFilters}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayedResources.map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onQuickBook={(res) => setSelectedForBooking(res)}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedForBooking && (
        <BookingModal
          resource={selectedForBooking}
          isOpen={Boolean(selectedForBooking)}
          onClose={() => setSelectedForBooking(null)}
          onSuccess={() => {
            setSelectedForBooking(null);
            navigate('/dashboard/bookings');
          }}
        />
      )}

      {/* Smart Resource Matcher Modal */}
      <SmartResourceMatcherModal
        isOpen={isSmartMatcherOpen}
        onClose={() => setIsSmartMatcherOpen(false)}
        initialQuery={searchInput}
        onSelectResourceForBooking={(res) => {
          setIsSmartMatcherOpen(false);
          setSelectedForBooking(res);
        }}
        onSelectResource={(res) => {
          setIsSmartMatcherOpen(false);
          setSelectedForBooking(res);
        }}
      />
    </div>
  );
};

export default ExploreResourcesPage;
