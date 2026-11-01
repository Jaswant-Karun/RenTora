import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  clearAllNotificationsApi,
} from '../api/resource.api';
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
  Trash2,
  ArrowRight,
  Sparkles,
  QrCode,
  Layers,
  Inbox,
} from 'lucide-react';

type NotificationFilter = 'all' | 'unread' | 'bookings' | 'waitlist' | 'safety' | 'reminders';

export const NotificationsPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await getNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      toast.error(err.response?.data?.message || 'Failed to load notifications');
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
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Error marking read:', err);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error('Error marking all read:', err);
      toast.error('Failed to mark all as read');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotificationApi(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification removed');
    } catch (err) {
      console.error('Error deleting notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    setActionLoading(true);
    try {
      await clearAllNotificationsApi();
      setNotifications([]);
      toast.success('All notifications cleared.');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      toast.error('Failed to clear notifications');
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_submitted':
        return <Inbox className="w-4 h-4 text-[#1769D2]" />;
      case 'booking_confirmed':
      case 'approval':
        return <CheckCircle2 className="w-4 h-4 text-[#16834A]" />;
      case 'rejection':
        return <AlertCircle className="w-4 h-4 text-[#DC2626]" />;
      case 'waitlist_update':
        return <Clock className="w-4 h-4 text-[#D97706]" />;
      case 'checkin_ready':
        return <QrCode className="w-4 h-4 text-purple-600" />;
      case 'overdue_alert':
        return <AlertTriangle className="w-4 h-4 text-[#DC2626]" />;
      case 'incident_reported':
      case 'incident_resolved':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'resource_availability':
        return <Layers className="w-4 h-4 text-[#1769D2]" />;
      default:
        return <Bell className="w-4 h-4 text-[#1769D2]" />;
    }
  };

  const getNotificationLink = (notif: NotificationItem) => {
    if (notif.link) return notif.link;
    if (notif.type.includes('waitlist')) return '/dashboard/waitlist';
    if (notif.type.includes('incident')) return '/dashboard/activity';
    return '/dashboard/bookings';
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'bookings')
      return (
        n.type?.includes('booking') ||
        n.type?.includes('approval') ||
        n.type?.includes('rejection')
      );
    if (filter === 'waitlist') return n.type?.includes('waitlist');
    if (filter === 'safety') return n.type?.includes('incident') || n.type?.includes('overdue');
    if (filter === 'reminders')
      return n.type?.includes('reminder') || n.type?.includes('checkin');
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
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
            Real-time updates regarding booking requests, custodian sign-offs, check-in passes, and safety alerts.
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
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 text-[#DC2626] text-xs font-medium border border-[#E2E8F0] shadow-xs transition-colors"
              title="Delete all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear history</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'bookings', label: 'Bookings' },
          { key: 'waitlist', label: 'Waitlist' },
          { key: 'safety', label: 'Safety & Incidents' },
          { key: 'reminders', label: 'Check-in & Reminders' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key as NotificationFilter)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
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
          <LoadingSpinner message="Retrieving in-app notifications from database..." size="md" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-[#172033]">No notifications found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            {filter === 'unread'
              ? 'You have read all pending notifications. Well done!'
              : 'You do not have any notifications matching this filter yet.'}
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard/explore"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1769D2] hover:bg-[#1256B0] text-white text-xs font-medium rounded-lg shadow-xs"
            >
              <span>Explore Campus Resources</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                notif.isRead
                  ? 'bg-white border-[#E2E8F0]'
                  : 'bg-[#EFF6FF]/50 border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-[#172033] truncate">{notif.title}</h3>
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1769D2] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span className="text-slate-400">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <Link
                      to={getNotificationLink(notif)}
                      className="text-[#1769D2] hover:underline font-medium inline-flex items-center gap-0.5"
                    >
                      <span>View record</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notif._id)}
                    className="px-2.5 py-1 text-[11px] font-medium text-[#1769D2] bg-[#EFF6FF] hover:bg-blue-100 rounded-md transition-colors"
                  >
                    Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleDelete(notif._id, e)}
                  className="p-1.5 text-slate-400 hover:text-[#DC2626] hover:bg-red-50 rounded-md transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

