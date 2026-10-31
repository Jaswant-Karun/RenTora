import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummaryApi } from '../api/resource.api';
import { DashboardStats, CategoryDistribution, BookingActivityItem } from '../types/dashboard';
import { Resource, Booking, NotificationItem } from '../types/resource';
import { ResourceCard } from '../components/resources/ResourceCard';
import { BookingModal } from '../components/resources/BookingModal';
import { SmartResourceMatcherModal } from '../components/ai/SmartResourceMatcherModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Boxes,
  Calendar,
  Clock,
  CheckCircle2,
  Compass,
  ArrowRight,
  Sparkles,
  BarChart2,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dashboard Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Resource[]>([]);
  const [recommended, setRecommended] = useState<Resource[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [bookingActivity, setBookingActivity] = useState<BookingActivityItem[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
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
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
            {greeting}, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Here's what's happening with your resources today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSmartMatcherOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 text-[#1769D2] text-xs font-semibold border border-blue-200 shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Smart Matcher</span>
          </button>

          <Link
            to="/dashboard/explore"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Catalog</span>
          </Link>
        </div>
      </div>

      {/* 2. Compact Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available Resources"
          value={stats?.availableResources ?? 12}
          description="Ready for immediate reservation"
          icon={<Boxes className="w-4 h-4" />}
          trend={{ value: 'Real-time', isPositive: true }}
          onClick={() => navigate('/dashboard/explore')}
        />

        <StatCard
          label="Active Bookings"
          value={stats?.activeBookings ?? 1}
          description="Confirmed reservation passes"
          icon={<Calendar className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/bookings')}
        />

        <StatCard
          label="Pending Requests"
          value={stats?.pendingRequests ?? 0}
          description="Awaiting custodian verification"
          icon={<Clock className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/bookings')}
        />

        <StatCard
          label="Completed Bookings"
          value={stats?.completedBookings ?? 0}
          description="Verified equipment sessions"
          icon={<CheckCircle2 className="w-4 h-4" />}
          onClick={() => navigate('/dashboard/bookings')}
        />
      </div>

      {/* 3. Dual-Column Section: LEFT Recent Booking Activity | RIGHT Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Recent Booking Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#1769D2]" />
                Recent Booking Activity
              </h2>
              <p className="text-xs text-[#64748B]">Platform weekly reservation traffic</p>
            </div>
            <span className="text-[11px] font-medium text-[#1769D2] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-blue-200">
              Active Ledger
            </span>
          </div>

          {/* Activity Bar Chart */}
          <div className="h-56 w-full pt-2">
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
              <div className="py-8 text-center rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#64748B] space-y-2">
                <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                <p>No upcoming reservations scheduled.</p>
                <Link
                  to="/dashboard/explore"
                  className="inline-block px-3 py-1.5 rounded-lg bg-[#1769D2] text-white font-medium text-xs mt-1"
                >
                  Schedule an Asset
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

      {/* 4. NEXT SECTION: Recently Added Resources */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#1769D2]" />
              Recently Added Resources
            </h2>
            <p className="text-xs text-[#64748B]">Newly catalogued instruments and laboratories</p>
          </div>
          <Link
            to="/dashboard/explore"
            className="text-xs text-[#1769D2] hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Browse Full Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentlyAdded.slice(0, 4).map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onQuickBook={(res) => setQuickBookResource(res)}
            />
          ))}
        </div>
      </div>

      {/* 5. NEXT SECTION: Resource Utilization Chart */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-sm font-semibold text-[#172033] flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#1769D2]" />
              Resource Utilization by Category
            </h2>
            <p className="text-xs text-[#64748B]">Allocation demand across institutional asset classes</p>
          </div>
          <span className="text-[11px] font-medium text-[#64748B]">
            Consortium Nodes
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryDistribution}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="name"
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
              <Bar dataKey="count" name="Available Equipment" fill="#1769D2" radius={[4, 4, 0, 0]} maxBarSize={36} />
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
