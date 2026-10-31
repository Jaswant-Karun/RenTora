import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getOwnerBookingsApi, getOwnerResourcesApi } from '../../api/owner.api';
import { Booking, Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';

export const OwnerCalendarPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, resourcesRes] = await Promise.all([
        getOwnerBookingsApi(),
        getOwnerResourcesApi(),
      ]);
      if (bookingsRes.success) setBookings(bookingsRes.data);
      if (resourcesRes.success) setResources(resourcesRes.data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (selectedResourceId !== 'all' && b.resource?._id !== selectedResourceId) {
      return false;
    }
    return b.status === 'active' || b.status === 'pending';
  });

  // Generate 7 days for the current week view
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  startOfWeek.setDate(diff);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const hours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-brand-400" />
            Availability & Schedule Calendar
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Weekly timeslot utilization, reservation collision view, and maintenance blackout intervals.
          </p>
        </div>

        {/* Resource Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Registered Equipment ({resources.length})</option>
            {resources.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextWeek}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-sm font-semibold text-white">
          {weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
          {weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" /> Confirmed Booking
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Pending Approval
          </span>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner message="Calculating temporal occupancy..." size="md" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-2xl">
          <div className="min-w-[800px]">
            {/* Days Header */}
            <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
              <div className="p-3 text-xs font-semibold text-slate-500 text-center border-r border-slate-800">
                Time
              </div>
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={i}
                    className={`p-3 text-center border-r border-slate-800 last:border-r-0 ${
                      isToday ? 'bg-brand-500/10' : ''
                    }`}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                      {d.toLocaleDateString(undefined, { weekday: 'short' })}
                    </p>
                    <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-brand-400 font-extrabold' : 'text-slate-200'}`}>
                      {d.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Time Rows */}
            <div className="divide-y divide-slate-800/60">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 min-h-[52px]">
                  {/* Hour label */}
                  <div className="p-2 text-xs font-mono text-slate-500 text-center border-r border-slate-800/80 flex items-center justify-center bg-slate-900/30">
                    {hour}
                  </div>

                  {/* Day cells */}
                  {weekDays.map((d, dayIdx) => {
                    const dateStr = d.toISOString().split('T')[0];

                    // Check if any booking falls on this day & overlaps this hour
                    const cellBookings = filteredBookings.filter((b) => {
                      const bDate = new Date(b.startTime).toISOString().split('T')[0];
                      if (bDate !== dateStr) return false;
                      const bHour = new Date(b.startTime).getHours();
                      const currentHourNum = parseInt(hour.split(':')[0], 10);
                      return bHour === currentHourNum;
                    });

                    return (
                      <div
                        key={dayIdx}
                        className="p-1 border-r border-slate-800/60 last:border-r-0 hover:bg-slate-900/40 transition-colors relative min-h-[52px]"
                      >
                        {cellBookings.map((b) => (
                          <div
                            key={b._id}
                            className={`p-1.5 rounded-lg text-[10px] leading-tight mb-1 shadow-sm border ${
                              b.status === 'active'
                                ? 'bg-brand-600/30 border-brand-500/50 text-brand-200'
                                : 'bg-amber-600/30 border-amber-500/50 text-amber-200'
                            }`}
                          >
                            <p className="font-bold truncate">{b.resource?.name}</p>
                            <p className="truncate text-slate-300">
                              {b.user?.name} ({new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
