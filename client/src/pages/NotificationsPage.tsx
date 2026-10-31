import React, { useState, useEffect } from 'react';
import { getNotificationsApi, markNotificationReadApi } from '../api/resource.api';
import { NotificationItem } from '../types/resource';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Bell,
  CheckCheck,
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';

type NotificationFilter = 'all' | 'unread' | 'bookings' | 'safety' | 'waitlist';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotificationsApi();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('rentora_token');
      const res = await fetch('http://localhost:5000/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setToastMessage('All notifications marked as read.');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerSweep = async () => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('rentora_token');
      const res = await fetch('http://localhost:5000/api/notifications/trigger-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`Diagnostic sweep complete. Generated ${data.generatedCount} reminder(s).`);
        await fetchNotifications();
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error triggering check sweep:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'bookings') {
      return ['booking_confirmed', 'approval', 'rejection', 'upcoming_booking', 'return_reminder', 'booking'].includes(
        n.type
      );
    }
    if (filter === 'safety') {
      return ['incident_update', 'overdue_alert', 'maintenance'].includes(n.type);
    }
    if (filter === 'waitlist') {
      return ['waitlist_update'].includes(n.type);
    }
    return true;
  });

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'approval':
        return {
          icon: CheckCircle2,
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          label: 'Approved / Confirmed',
        };
      case 'rejection':
        return {
          icon: AlertCircle,
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          label: 'Request Rejected',
        };
      case 'waitlist_update':
        return {
          icon: Clock,
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          label: 'Waitlist Standing',
        };
      case 'upcoming_booking':
        return {
          icon: Calendar,
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          label: 'Upcoming Session',
        };
      case 'return_reminder':
        return {
          icon: Clock,
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          label: 'Return Reminder',
        };
      case 'overdue_alert':
        return {
          icon: AlertTriangle,
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          label: 'Overdue Alert',
        };
      case 'incident_update':
        return {
          icon: ShieldAlert,
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          label: 'Incident Management',
        };
      default:
        return {
          icon: Bell,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          label: 'System Notification',
        };
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              Real-time In-App Dispatch
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Notification Center</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Live updates regarding booking confirmations, approvals, waitlists, upcoming returns, overdue alerts, and incident reviews.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSweep}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
              title="Scan active bookings for upcoming starts, return reminders, and overdue sessions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Diagnostic Sweep</span>
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {[
          { id: 'all', label: 'All Notifications', count: notifications.length },
          { id: 'unread', label: 'Unread Only', count: unreadCount },
          {
            id: 'bookings',
            label: 'Bookings & Returns',
            count: notifications.filter((n) =>
              ['booking_confirmed', 'approval', 'rejection', 'upcoming_booking', 'return_reminder'].includes(n.type)
            ).length,
          },
          {
            id: 'waitlist',
            label: 'Waitlist Updates',
            count: notifications.filter((n) => n.type === 'waitlist_update').length,
          },
          {
            id: 'safety',
            label: 'Safety & Incidents',
            count: notifications.filter((n) => ['incident_update', 'overdue_alert', 'maintenance'].includes(n.type)).length,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as NotificationFilter)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              filter === tab.id
                ? 'bg-brand-600 text-white shadow'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  filter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications Feed */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Loading notification dispatches..." size="md" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-2">
          <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No notifications in this view.</p>
          <p className="text-[11px] text-slate-500">You are all caught up with campus resource dispatches.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const badge = getNotificationBadge(n.type);
            const Icon = badge.icon;

            return (
              <div
                key={n._id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  n.isRead
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                    : 'bg-slate-900 border-brand-500/40 text-slate-200 shadow-lg shadow-black/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{n.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      {!n.isRead && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-brand-500 text-white animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{n.message}</p>

                    <span className="text-[10px] text-slate-500 block pt-0.5">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all border border-slate-700"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
