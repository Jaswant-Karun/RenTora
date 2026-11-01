import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummaryApi } from '../api/resource.api';
import {
  DashboardStats,
  CategoryDistribution,
  BookingActivityItem,
  UserActivityTimelineItem,
} from '../types/dashboard';
import { Resource, Booking } from '../types/resource';
import { ResourceCard } from '../components/resources/ResourceCard';
import { BookingModal } from '../components/resources/BookingModal';
import { SmartResourceMatcherModal } from '../components/ai/SmartResourceMatcherModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { handleImageFallback } from '../utils/resourceImages';
import {
  Boxes,
  Calendar,
  Clock,
  CheckCircle2,
  Compass,
  Sparkles,
  BarChart2,
  Activity,
  History,
  Building,
  Bookmark,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dashboard Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Resource[]>([]);
  const [recommended, setRecommended] = useState<Resource[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<Booking[]>([]);
  const [userActivityTimeline, setUserActivityTimeline] = useState<UserActivityTimelineItem[]>([]);
  const [bookingActivity, setBookingActivity] = useState<BookingActivityItem[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick booking modal & AI matcher
  const [quickBookResource, setQuickBookResource] = useState<Resource | null>(null);
  const [isSmartMatcherOpen, setIsSmartMatcherOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await getDashboardSummaryApi();
        if (res.success && res.data) {
          setStats(res.data.stats);
          setRecentlyAdded(res.data.recentlyAdded || []);
          setRecommended(res.data.recommended || []);
          setUpcomingBookings(res.data.upcomingBookings || []);
          setWaitlistEntries(res.data.waitlistEntries || []);
          setUserActivityTimeline(res.data.userActivityTimeline || []);
          setBookingActivity(res.data.bookingActivity || []);
          setCategoryDistribution(res.data.categoryDistribution || []);
        }
      } catch (err) {
        console.error('Error loading dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    // Load recently viewed resources from localStorage
    try {
      const raw = localStorage.getItem('rentora_recently_viewed');
      if (raw) {
        setRecentlyViewed(JSON.parse(raw));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  if (!user) return null;

  if (loading && !stats) {
    return (
      <div className="py-24 flex justify-center items-center">
        <LoadingSpinner message="Loading your institutional dashboard..." size="lg" />
      </div>
    );
  }

  // Greeting by time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      {/* 1. Header Section with Institution & Personalization context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              {greeting}, {user.name}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-blue-200">
              <Building className="w-3 h-3" />
              {user.institution || 'Institutional Consortium'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Resource discovery, reservations, and compliance status for {user.department || 'Academic Research'}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSmartMatcherOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#1769D2] text-xs font-semibold border border-blue-200 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Smart Matcher</span>
          </button>

          <Link
            to="/dashboard/explore"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Marketplace</span>
          </Link>
        </div>
      </div>

      {/* 2. Active Waitlist Priority Banner (if user has waitlisted reservations) */}
      {stats?.waitlistedCount && stats.waitlistedCount > 0 ? (
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-[#D97706] flex items-center justify-center shrink-0 border border-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                Active Waitlist Queue: Position #{waitlistEntries[0]?.queuePosition || 1}
                <span className="text-[10px] font-mono font-normal text-[#D97706] bg-amber-100 px-1.5 py-0.2 rounded">
                  High Priority
                </span>
              </h4>
              <p className="text-xs text-[#64748B] mt-0.5">
                You have {stats.waitlistedCount} pending queue reservation{stats.waitlistedCount > 1 ? 's' : ''} for{' '}
                <strong className="text-[#172033]">
                  {waitlistEntries[0]?.resourceName || 'high-demand equipment'}
                </strong>.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/waitlist"
            className="px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 text-[#D97706] font-semibold text-xs shrink-0 transition-colors shadow-xs"
          >
            View Queue Position
          </Link>
        </div>
      ) : null}

      {/* 3. Standardized 6-Stat Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label="Total Bookings"
          value={stats?.totalBookings ?? 0}
          description="Lifetime sessions"
          icon={<Bookmark className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/bookings')}
        />

        <StatCard
          label="Active Passes"
          value={stats?.activeBookings ?? 0}
          description="In hand / operational"
          icon={<Activity className="w-4 h-4" />}
          trend={{ value: 'Active', isPositive: true }}
          onClick={() => navigate('/dashboard/bookings?status=active')}
        />

        <StatCard
          label="Upcoming"
          value={upcomingBookings.length}
          description="Scheduled sessions"
          icon={<Calendar className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/bookings')}
        />

        <StatCard
          label="Pending Review"
          value={stats?.pendingRequests ?? 0}
          description="Custodian review"
          icon={<Clock className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/bookings?status=pending')}
        />

        <StatCard
          label="Completed"
          value={stats?.completedBookings ?? 0}
          description="Verified returns"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/bookings?status=completed')}
        />

        <StatCard
          label="Catalog Assets"
          value={stats?.availableResources ?? 12}
          description="Ready now"
          icon={<Boxes className="w-4 h-4" />}
          trend={{ value: 'Consortium', isPositive: true }}
          onClick={() => navigate('/dashboard/explore')}
        />
      </div>

      {/* 4. FEATURE 6 & 4: Personalized Recommended Resources for Student */}
      {recommended.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1769D2]" />
                <h2 className="text-sm font-semibold text-[#172033]">
                  Recommended for You
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-blue-200">
                  Personalized
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Curated based on your affiliation with {user.institution || 'Consortium'} and high institutional demand.
              </p>
            </div>
            <Link
              to="/dashboard/explore"
              className="text-xs text-[#1769D2] hover:underline font-medium inline-flex items-center gap-1 shrink-0"
            >
              <span>Explore Marketplace</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommended.slice(0, 4).map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onQuickBook={(res) => setQuickBookResource(res)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. FEATURE 4: Recently Viewed Resources (from local browser history) */}
      {recentlyViewed.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#1769D2]" />
              <h2 className="text-sm font-semibold text-[#172033]">
                Recently Viewed Apparatus & Labs
              </h2>
            </div>
            <span className="text-xs text-[#64748B]">
              Quick re-booking access
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentlyViewed.slice(0, 4).map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onQuickBook={(res) => setQuickBookResource(res)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 6. Dual-Column Section: LEFT Platform Booking Telemetry & Activity Timeline | RIGHT Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Booking Telemetry & Live Timeline (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1769D2]" />
                Booking Activity & Telemetry
              </h2>
              <p className="text-xs text-[#64748B]">Weekly hours logged across research equipment</p>
            </div>
            <span className="text-[11px] font-medium text-[#1769D2] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-blue-200">
              Live DB Telemetry
            </span>
          </div>

          {/* Activity Bar Chart */}
          <div className="h-52 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="bookings" name="Bookings" fill="#1769D2" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Live Recent Booking Activity Timeline */}
          {userActivityTimeline.length > 0 && (
            <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
              <span className="text-xs font-semibold text-[#172033] block">
                Your Recent Booking Activity Events
              </span>
              <div className="space-y-2">
                {userActivityTimeline.slice(0, 4).map((item) => (
                  <div
                    key={item._id}
                    className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <p className="font-semibold text-[#172033] truncate">{item.resourceName}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {item.date} • {item.timeSlot}
                      </p>
                    </div>
                    <StatusBadge status={item.status as any} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Upcoming Bookings (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1769D2]" />
                Upcoming Bookings
              </h2>
              <p className="text-xs text-[#64748B]">Your scheduled equipment sessions</p>
            </div>
            <Link
              to="/dashboard/bookings"
              className="text-xs text-[#1769D2] hover:underline font-medium"
            >
              View all
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingBookings.length === 0 ? (
              <div className="py-12 text-center rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] space-y-2">
                <Clock className="w-7 h-7 text-slate-400 mx-auto" />
                <p>No upcoming reservations scheduled.</p>
                <Link
                  to="/dashboard/explore"
                  className="inline-block px-3.5 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white font-semibold text-xs mt-1 transition-colors"
                >
                  Reserve an Equipment Slot
                </Link>
              </div>
            ) : (
              upcomingBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3 hover:border-[#CBD5E1] transition-colors"
                >
                  <img
                    src={b.resourceImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                    alt={b.resourceName}
                    onError={(e) => handleImageFallback(e, b.resourceCategory)}
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[#E2E8F0]"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-semibold text-[#172033] truncate">{b.resourceName}</p>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                      {b.date} • {b.timeSlot}
                    </p>
                  </div>
                  <StatusBadge status={b.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 7. Category Demand & Distribution (Real Aggregation) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1769D2]" />
              Resource Distribution Across Asset Classes
            </h2>
            <p className="text-xs text-[#64748B]">Real-time equipment availability aggregated by category</p>
          </div>
          <span className="text-[11px] font-medium text-[#64748B]">
            Institutional Inventory
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryDistribution}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                }}
              />
              <Bar dataKey="count" name="Total Equipment" fill="#1769D2" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="availableCount" name="Available Now" fill="#16834A" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Booking Modal */}
      {quickBookResource && (
        <BookingModal
          resource={quickBookResource}
          isOpen={Boolean(quickBookResource)}
          onClose={() => setQuickBookResource(null)}
          onSuccess={() => {
            setQuickBookResource(null);
            navigate('/dashboard/bookings');
          }}
        />
      )}

      {/* AI Smart Resource Matcher Modal */}
      <SmartResourceMatcherModal
        isOpen={isSmartMatcherOpen}
        onClose={() => setIsSmartMatcherOpen(false)}
        onSelectResource={(res) => {
          setIsSmartMatcherOpen(false);
          setQuickBookResource(res);
        }}
      />
    </div>
  );
};

export default DashboardPage;
