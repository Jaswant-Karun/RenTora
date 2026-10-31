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
} from 'lucide-react';

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
  const selectedAvailability = searchParams.get('availability') || 'All';
  const selectedDate = searchParams.get('date') || '';
  const selectedSort = searchParams.get('sort') || 'name_asc';

  // Data states
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState<{
    institutions: string[];
    locations: string[];
    categories: string[];
  }>({ institutions: [], locations: [], categories: [] });

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
          availability: selectedAvailability !== 'All' ? selectedAvailability : undefined,
          date: selectedDate || undefined,
          limit: 32,
        });

        if (res.success) {
          let items = res.data;
          // Apply client sorting if needed
          if (selectedSort === 'name_asc') {
            items = [...items].sort((a, b) => a.name.localeCompare(b.name));
          } else if (selectedSort === 'name_desc') {
            items = [...items].sort((a, b) => b.name.localeCompare(a.name));
          }
          setResources(items);
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
    selectedAvailability,
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

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedInstitution !== 'All' ||
    selectedAvailability !== 'All' ||
    Boolean(selectedDate) ||
    Boolean(debouncedSearch);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Resource Marketplace
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Discover, check availability, and schedule specialized institutional equipment across partner universities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSmartMatcherOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#1769D2] text-xs font-semibold border border-blue-200 shadow-xs transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Smart Matcher</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm space-y-3">
        {/* Search Input & Select Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Text Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by equipment name, specification, tag..."
              className="w-full bg-[#F8FAFC] text-[#172033] placeholder-[#94A3B8] text-xs rounded-lg pl-9 pr-3 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2] focus:ring-1 focus:ring-[#1769D2] transition-colors"
            />
          </div>

          {/* Institution Filter */}
          <div>
            <select
              value={selectedInstitution}
              onChange={(e) => updateFilter('institution', e.target.value)}
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-2.5 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            >
              <option value="All">All Institutions</option>
              {filterOptions.institutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={selectedAvailability}
              onChange={(e) => updateFilter('availability', e.target.value)}
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-2.5 py-2 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
            >
              <option value="All">All Statuses</option>
              <option value="available">Available Now</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => updateFilter('date', e.target.value)}
              className="w-full bg-[#F8FAFC] text-[#172033] text-xs rounded-lg px-2.5 py-1.5 border border-[#E2E8F0] focus:bg-white focus:outline-none focus:border-[#1769D2]"
              title="Filter by required date"
            />
          </div>
        </div>

        {/* Horizontal Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => updateFilter('category', 'All')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
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
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1769D2] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
          <span>
            Showing <strong className="text-[#172033]">{resources.length}</strong> of{' '}
            <strong className="text-[#172033]">{totalCount}</strong> assets
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-[#DC2626] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
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
      ) : resources.length === 0 ? (
        <EmptyState
          title="No resources matched your search"
          description="Try broadening your category filters, clearing the date requirement, or searching for a different apparatus."
          actionLabel="Clear all filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resources.map((resource) => (
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
        onSelectResource={(res) => {
          setIsSmartMatcherOpen(false);
          setSelectedForBooking(res);
        }}
      />
    </div>
  );
};

export default ExploreResourcesPage;
