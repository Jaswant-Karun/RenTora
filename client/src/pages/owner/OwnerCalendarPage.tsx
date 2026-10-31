import React, { useState, useEffect } from 'react';
import { getOwnerBookingsApi, getOwnerResourcesApi } from '../../api/owner.api';
import { Booking, Resource } from '../../types/resource';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
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

  const filteredBookings = bookings.filter((b) => {
    if (selectedResourceId !== 'all' && (b.resource?._id !== selectedResourceId && b.resourceId !== selectedResourceId)) {
      return false;
    }
    return b.status === 'active' || b.status === 'pending';
  });

  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
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
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[#1769D2]" />
            Availability & Schedule Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Weekly resource occupancy matrix, planned maintenance, and active reservation slots.
          </p>
        </div>

        {/* Filter and Week Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 shadow-sm">
            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="bg-transparent text-xs text-[#172033] focus:outline-none"
            >
              <option value="all">All Resources</option>
              {resources.map((res) => (
                <option key={res._id} value={res._id}>
                  {res.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-lg p-1 shadow-sm">
            <button
              onClick={prevWeek}
              className="p-1 hover:bg-slate-100 rounded text-[#64748B] hover:text-[#172033] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 text-[#172033]">
              {weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
              {weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
            <button
              onClick={nextWeek}
              className="p-1 hover:bg-slate-100 rounded text-[#64748B] hover:text-[#172033] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner message="Querying schedule matrix..." size="md" />
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-[#E2E8F0] bg-[#F8FAFC] text-center text-xs">
            <div className="p-3 font-semibold text-[#64748B] border-r border-[#E2E8F0]">Time</div>
            {weekDays.map((d, i) => (
              <div key={i} className="p-3 border-r border-[#E2E8F0] last:border-r-0">
                <span className="block text-[10px] font-semibold text-[#64748B] uppercase">
                  {d.toLocaleDateString([], { weekday: 'short' })}
                </span>
                <span className="block text-sm font-bold text-[#172033] mt-0.5">{d.getDate()}</span>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="divide-y divide-[#E2E8F0]">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[56px]">
                <div className="p-2 text-right pr-3 text-[11px] font-mono text-[#64748B] border-r border-[#E2E8F0] bg-[#F8FAFC]">
                  {hour}
                </div>
                {weekDays.map((d, dayIdx) => {
                  const dateStr = d.toISOString().split('T')[0];
                  const dayBookings = filteredBookings.filter((b) => {
                    const bDate = b.date || (b.startTime ? b.startTime.split('T')[0] : '');
                    return bDate === dateStr;
                  });

                  return (
                    <div
                      key={dayIdx}
                      className="p-1 border-r border-[#E2E8F0] last:border-r-0 hover:bg-slate-50 transition-colors relative"
                    >
                      {dayBookings.slice(0, 1).map((b) => (
                        <div
                          key={b._id}
                          className={`p-1.5 rounded text-[10px] border leading-tight ${
                            b.status === 'active'
                              ? 'bg-[#EFF6FF] text-[#1769D2] border-[#1769D2]/30'
                              : 'bg-amber-50 text-[#D97706] border-amber-200'
                          }`}
                        >
                          <strong className="block truncate font-semibold">
                            {b.resourceName || b.resource?.name || 'Asset'}
                          </strong>
                          <span className="text-[9px] block text-[#64748B] truncate">
                            {b.userName || b.user?.name || 'Borrower'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerCalendarPage;
