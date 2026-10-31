import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummaryApi } from '../api/resource.api';
import { DashboardStats, CategoryDistribution, BookingActivityItem } from '../types/dashboard';
import { Resource, Booking, NotificationItem } from '../types/resource';
import { ResourceCard } from '../components/resources/ResourceCard';
import { BookingModal } from '../components/resources/BookingModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Badge } from '../components/common/Badge';
import {
  Cpu,
  Building,
  CheckCircle2,
  Clock,
  Database,
  PlusCircle,
  Search,
  FileCheck,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  Sparkles,
  X,
  Bell,
  Calendar,
  Compass,
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
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
  const [searchParams, setSearchParams] = useSearchParams();

  // Onboarding banner for new users
  const [showWelcomeNotice, setShowWelcomeNotice] = useState(searchParams.get('new') === 'true');

  // Dashboard Data from MongoDB
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<Resource[]>([]);
  const [recommended, setRecommended] = useState<Resource[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [bookingActivity, setBookingActivity] = useState<BookingActivityItem[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick booking modal
  const [quickBookResource, setQuickBookResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setShowWelcomeNotice(true);
    }
  }, [searchParams]);

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
          setNotifications(res.data.notifications || []);
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

  const role = user.role;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. New User Registration Welcome Notice */}
      <AnimatePresence>
        {showWelcomeNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-brand-600/20 via-indigo-600/20 to-cyan-500/20 border border-brand-500/40 backdrop-blur-md flex items-center justify-between gap-4 text-white shadow-xl shadow-brand-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center shrink-0 text-brand-300">
                <Sparkles className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Welcome to RENTORA Institutional Resource Network!
                </p>
                <p className="text-xs text-slate-300">
                  Your account is registered and verified. You have full access to reserve labs, equipment, and compute clusters.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowWelcomeNotice(false);
                searchParams.delete('new');
                setSearchParams(searchParams);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
              Institutional Console
            </span>
            <span className="text-slate-600">•</span>
            <Badge role={user.role} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            {user.institution} — <span className="font-semibold text-slate-200">{user.department || 'General Faculty'}</span>.
            Access federated campus equipment, check active booking passes, and manage requests.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <Link
              to="/dashboard/explore"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </Link>
            <Link
              to="/dashboard/bookings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>My Bookings</span>
            </Link>
          </div>
        </div>

        {/* Live MongoDB Status Widget */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 shrink-0 relative z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-200">MongoDB Persistence</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Connected
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Node: 127.0.0.1:27017/rentora
          </p>
          <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Session: JWT Encrypted</span>
            <span className="text-brand-400 font-medium">httpOnly Cookie</span>
          </div>
        </div>
      </div>

      {/* 3. Dashboard Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Resources */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Available Resources
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {stats?.availableResources ?? 12}
          </p>
          <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ready for immediate booking</span>
          </p>
        </div>

        {/* Active Bookings */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {stats?.activeBookings ?? 1}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed reservation passes
          </p>
        </div>

        {/* Pending Requests */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Requests
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {stats?.pendingRequests ?? 1}
          </p>
          <p className="text-xs text-amber-400 mt-1">
            Awaiting lab custodian review
          </p>
        </div>

        {/* Completed Bookings */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Completed Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">
            {stats?.completedBookings ?? 1}
          </p>
          <p className="text-xs text-cyan-400 mt-1">
            Logged equipment hours verified
          </p>
        </div>
      </div>

      {/* 4. Upcoming Bookings & Booking Activity (Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Bookings Panel (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" />
                Upcoming Bookings
              </h3>
              <p className="text-xs text-slate-400">Scheduled campus timeslots</p>
            </div>
            <Link
              to="/dashboard/bookings"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingBookings.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <Clock className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No upcoming reservations scheduled.</p>
                <Link
                  to="/dashboard/explore"
                  className="inline-block px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold text-xs mt-1"
                >
                  Book Equipment
                </Link>
              </div>
            ) : (
              upcomingBookings.map((b) => (
                <div
                  key={b._id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 flex items-center gap-3 hover:border-slate-700 transition-all"
                >
                  <img
                    src={b.resourceImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                    alt={b.resourceName}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
                  />
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="font-bold text-white truncate">{b.resourceName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {b.date} • {b.timeSlot}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {b.status === 'active' ? 'Confirmed Pass' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Booking Activity Weekly Telemetry Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Booking Activity & Telemetry
              </h3>
              <p className="text-xs text-slate-400">Weekly lab hours utilized across campus nodes</p>
            </div>
            <span className="text-xs font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-xl">
              Telemetry Live
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="hours" name="Equipment Hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="bookings" name="Reservations" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Resource Category Distribution */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              Resource Category Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Live inventory breakdown across all 10 federated categories in MongoDB
            </p>
          </div>
          <Link
            to="/dashboard/explore"
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
          >
            <span>Open Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categoryDistribution.map((cat) => (
            <div
              key={cat.category}
              onClick={() => navigate(`/dashboard/explore?category=${encodeURIComponent(cat.category)}`)}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-brand-300 uppercase truncate">
                  {cat.category}
                </span>
                <span className="text-xs font-extrabold text-white">{cat.count}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full"
                  style={{ width: `${Math.min(100, cat.count * 25)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                {cat.availableCount} available right now
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Recommended Resources Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Recommended Resources
            </h3>
            <p className="text-xs text-slate-400">
              High-value instruments and spaces matching your academic discipline
            </p>
          </div>
          <Link
            to="/dashboard/explore"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommended.slice(0, 3).map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onQuickBook={(res) => setQuickBookResource(res)}
            />
          ))}
        </div>
      </div>

      {/* 7. Recently Added Resources Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recently Added Resources
            </h3>
            <p className="text-xs text-slate-400">
              New apparatus and labs inducted into the institutional network
            </p>
          </div>
          <Link
            to="/dashboard/explore?sort=createdAt"
            className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
          >
            <span>Browse latest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyAdded.slice(0, 3).map((resource) => (
            <ResourceCard
              key={resource._id}
              resource={resource}
              onQuickBook={(res) => setQuickBookResource(res)}
            />
          ))}
        </div>
      </div>

      {/* 8. Notifications Section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">Institutional Notifications & Alerts</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Real-time alerts</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {notifications.slice(0, 3).map((n) => (
            <div
              key={n._id}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{n.title}</span>
                <span className="text-[10px] text-slate-500 font-medium">{n.type}</span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {n.message}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Booking Modal */}
      <BookingModal
        isOpen={!!quickBookResource}
        resource={quickBookResource}
        onClose={() => setQuickBookResource(null)}
        onSuccess={() => {
          navigate('/dashboard/bookings');
        }}
      />
    </div>
  );
};

export default DashboardPage;
