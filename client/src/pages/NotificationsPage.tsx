import React, { useState, useEffect } from 'react';
import { getNotificationsApi, markNotificationReadApi } from '../api/resource.api';
import { NotificationItem } from '../types/resource';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Bell, CheckCheck, Clock, ShieldAlert, Sparkles } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
          <Bell className="w-3.5 h-3.5" />
          Alerts & Dispatches
        </div>
        <h1 className="text-2xl font-extrabold text-white">System & Booking Notifications</h1>
        <p className="text-xs text-slate-400">
          Real-time updates regarding your reservations, lab clearance endorsements, and scheduled maintenance windows.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <LoadingSpinner message="Loading notifications..." size="md" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
          No notifications at this time.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                n.isRead
                  ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                  : 'bg-slate-900 border-brand-500/40 text-slate-200 shadow-md'
              }`}
            >
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{n.title}</span>
                  {!n.isRead && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed">{n.message}</p>
                <span className="text-[10px] text-slate-500 block pt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium shrink-0 flex items-center gap-1.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark Read</span>
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
