import React, { useState, useEffect } from 'react';
import { getNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from '../api/resource.api';
import { NotificationItem } from '../types/resource';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  CheckCheck,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

type NotificationFilter = 'all' | 'unread' | 'bookings' | 'safety';

export const NotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [actionLoading, setActionLoading] = useState(false);

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
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setToastMessage('All notifications marked as read.');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      console.error('Error marking all read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
      case 'approval':
        return <CheckCircle2 className="w-4 h-4 text-[#16834A]" />;
      case 'rejection':
      case 'overdue_alert':
        return <AlertCircle className="w-4 h-4 text-[#DC2626]" />;
      case 'waitlist_update':
        return <Clock className="w-4 h-4 text-[#D97706]" />;
      default:
        return <Bell className="w-4 h-4 text-[#1769D2]" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'bookings') return n.type?.includes('booking') || n.type?.includes('approval');
    if (filter === 'safety') return n.type?.includes('incident') || n.type?.includes('overdue');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-[#16834A]">
          {toastMessage}
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">Notification Center</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1769D2] border border-blue-200">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time updates regarding booking requests, custodian sign-offs, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchNotifications}
            className="p-2 text-[#64748B] hover:text-[#172033] rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#172033] text-xs font-medium border border-[#E2E8F0] shadow-xs transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#16834A]" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: 'All Notifications' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'bookings', label: 'Booking Updates' },
          { key: 'safety', label: 'Safety & Incidents' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as NotificationFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === tab.key
                ? 'bg-[#1769D2] text-white shadow-xs font-semibold'
                : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Items List */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Retrieving in-app notifications..." size="md" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No notifications to show"
          description="You are completely caught up. New reservation updates will appear here."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                notif.isRead
                  ? 'bg-white border-[#E2E8F0]'
                  : 'bg-[#EFF6FF]/40 border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[#172033]">{notif.title}</h3>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1769D2]" />
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{notif.message}</p>
                  <p className="text-[10px] text-slate-400 pt-0.5">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="px-2 py-1 text-[11px] font-medium text-[#1769D2] hover:bg-blue-50 rounded-md shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
