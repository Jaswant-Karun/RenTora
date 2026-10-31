import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getBookingsApi, updateBookingStatusApi } from '../api/resource.api';
import { Booking } from '../types/resource';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  CalendarCheck,
  Clock,
  Building,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Compass,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookingsApi(statusFilter !== 'all' ? statusFilter : undefined);
      if (res.success) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this equipment reservation?')) return;
    setActionLoading(id);
    try {
      await updateBookingStatusApi(id, 'cancelled');
      await fetchBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed Pass
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending Endorsement
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Session Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30 text-[10px] font-bold uppercase tracking-wider">
            <CalendarCheck className="w-3.5 h-3.5" />
            Booking Management
          </div>
          <h1 className="text-2xl font-extrabold text-white">My Resource Bookings</h1>
          <p className="text-xs text-slate-400">
            Track your confirmed passes, pending endorsements, and completed research sessions.
          </p>
        </div>

        <Link
          to="/dashboard/explore"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-500/20 transition-all shrink-0"
        >
          <Compass className="w-4 h-4" />
          <span>Book More Resources</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['all', 'active', 'pending', 'completed', 'cancelled'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              statusFilter === st
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st === 'all' ? 'All Bookings' : st}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Fetching your institutional reservations..." size="lg" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No bookings found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You don't have any bookings matching this filter. Explore the marketplace to reserve lab instruments.
          </p>
          <Link
            to="/dashboard/explore"
            className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white font-semibold text-xs mt-2"
          >
            Explore Resources
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
            >
              <div className="flex items-start gap-4">
                <img
                  src={booking.resourceImage || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'}
                  alt={booking.resourceName}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-800 mt-1"
                />
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-brand-300 border border-slate-800">
                      {booking.resourceCategory}
                    </span>
                    {getStatusBadge(booking.status)}
                  </div>
                  <h3
                    onClick={() => navigate(`/dashboard/resources/${booking.resourceId}`)}
                    className="text-sm font-bold text-white hover:text-brand-300 cursor-pointer"
                  >
                    {booking.resourceName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1 text-white font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-brand-400" />
                      {booking.date}
                    </span>
                    <span className="flex items-center gap-1 text-white font-semibold">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {booking.timeSlot}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {booking.resourceLocation}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    <strong className="text-slate-300">Purpose:</strong> {booking.purpose}
                  </p>
                  {booking.supervisorName && (
                    <p className="text-[10px] text-slate-500">
                      Endorsing Faculty: {booking.supervisorName}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                <button
                  onClick={() => navigate(`/dashboard/resources/${booking.resourceId}`)}
                  className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                >
                  View Resource
                </button>
                {booking.status === 'pending' || booking.status === 'active' ? (
                  <button
                    disabled={actionLoading === booking._id}
                    onClick={() => handleCancelBooking(booking._id)}
                    className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {actionLoading === booking._id ? 'Cancelling...' : 'Cancel'}
                  </button>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
