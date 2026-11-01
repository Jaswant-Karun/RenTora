import { Response, NextFunction } from 'express';
import { Notification, NotificationType } from '../models/notification.model.js';
import { Booking } from '../models/booking.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';

// 1. Get User In-App Notifications
export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    const query: any = {};
    if (user) {
      query.$or = [{ userId: user._id }, { targetRole: 'all' }, { targetRole: user.role }];
    }
    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Mark Single Notification Read
export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Mark All Notifications Read
export const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    await Notification.updateMany(
      { $or: [{ userId: req.user._id }, { targetRole: 'all' }, { targetRole: req.user.role }] },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    next(error);
  }
};

// 4. Trigger / Scan for Automated Booking Reminders, Upcoming Bookings, and Overdue Resources
export const triggerNotificationCheck = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    let generatedCount = 0;

    // A. UPCOMING BOOKING NOTIFICATIONS (starts within 24h)
    const upcomingBookings = await Booking.find({
      status: 'approved',
      startTime: { $gte: now, $lte: next24Hours },
    });

    for (const b of upcomingBookings) {
      const exists = await Notification.findOne({
        userId: b.userId,
        type: 'upcoming_booking',
        'metadata.bookingId': b._id,
      });

      if (!exists) {
        await Notification.create({
          userId: b.userId,
          title: 'Upcoming Reservation Reminder',
          message: `Your booking for "${b.resourceName}" starts at ${new Date(b.startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}. Please review lab safety protocols before arriving.`,
          type: 'upcoming_booking',
          link: '/dashboard/bookings',
          metadata: { bookingId: b._id },
        });
        generatedCount++;
      }
    }

    // B. RETURN REMINDER NOTIFICATIONS (checked_in, ending within 2 hours)
    const endingSoonBookings = await Booking.find({
      status: 'checked_in',
      endTime: { $gte: now, $lte: next2Hours },
    });

    for (const b of endingSoonBookings) {
      const exists = await Notification.findOne({
        userId: b.userId,
        type: 'return_reminder',
        'metadata.bookingId': b._id,
      });

      if (!exists) {
        await Notification.create({
          userId: b.userId,
          title: 'Resource Return Reminder',
          message: `Your session with "${b.resourceName}" concludes at ${new Date(b.endTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}. Please clean up workspace and initiate return handback.`,
          type: 'return_reminder',
          link: '/dashboard/bookings',
          metadata: { bookingId: b._id },
        });
        generatedCount++;
      }
    }

    // C. OVERDUE RESOURCES NOTIFICATIONS (checked_in, endTime < now)
    const overdueBookings = await Booking.find({
      status: { $in: ['checked_in', 'return_pending'] },
      endTime: { $lt: now },
      checkedOut: false,
    });

    for (const b of overdueBookings) {
      b.isOverdue = true;
      await b.save();

      const exists = await Notification.findOne({
        userId: b.userId,
        type: 'overdue_alert',
        'metadata.bookingId': b._id,
      });

      if (!exists) {
        await Notification.create({
          userId: b.userId,
          title: 'URGENT: Resource Overdue for Return',
          message: `"${b.resourceName}" was scheduled for return by ${new Date(b.endTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}. Late returns incur campus fair-share penalty points.`,
          type: 'overdue_alert',
          link: '/dashboard/bookings',
          metadata: { bookingId: b._id },
        });
        generatedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Safety & reminder diagnostic sweep complete. ${generatedCount} notifications generated.`,
      generatedCount,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Single Notification
export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: 'Notification removed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// 6. Clear All Notifications for Current User
export const clearAllNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    await Notification.deleteMany({
      $or: [{ userId: req.user._id }, { targetRole: 'all' }, { targetRole: req.user.role }],
    });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared.',
    });
  } catch (error) {
    next(error);
  }
};
