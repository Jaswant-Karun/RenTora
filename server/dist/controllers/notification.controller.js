"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllNotifications = exports.deleteNotification = exports.triggerNotificationCheck = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getNotifications = void 0;
const notification_model_js_1 = require("../models/notification.model.js");
const booking_model_js_1 = require("../models/booking.model.js");
// 1. Get User In-App Notifications
const getNotifications = async (req, res, next) => {
    try {
        const user = req.user;
        const query = {};
        if (user) {
            query.$or = [{ userId: user._id }, { targetRole: 'all' }, { targetRole: user.role }];
        }
        const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
        const skip = (pageNum - 1) * limitNum;
        const [notifications, total, unreadCount] = await Promise.all([
            notification_model_js_1.Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            notification_model_js_1.Notification.countDocuments(query),
            notification_model_js_1.Notification.countDocuments({ ...query, isRead: false }),
        ]);
        res.status(200).json({
            success: true,
            unreadCount,
            data: notifications,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
// 2. Mark Single Notification Read
const markNotificationRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await notification_model_js_1.Notification.findOneAndUpdate({
            _id: id,
            $or: [{ userId: req.user?._id }, { targetRole: 'all' }, { targetRole: req.user?.role }],
        }, { isRead: true }, { new: true });
        res.status(200).json({
            success: true,
            data: notification,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markNotificationRead = markNotificationRead;
// 3. Mark All Notifications Read
const markAllNotificationsRead = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        await notification_model_js_1.Notification.updateMany({ $or: [{ userId: req.user._id }, { targetRole: 'all' }, { targetRole: req.user.role }] }, { $set: { isRead: true } });
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
// 4. Trigger / Scan for Automated Booking Reminders, Upcoming Bookings, and Overdue Resources
const triggerNotificationCheck = async (_req, res, next) => {
    try {
        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        let generatedCount = 0;
        // A. UPCOMING BOOKING NOTIFICATIONS (starts within 24h)
        const upcomingBookings = await booking_model_js_1.Booking.find({
            status: 'approved',
            startTime: { $gte: now, $lte: next24Hours },
        });
        for (const b of upcomingBookings) {
            const exists = await notification_model_js_1.Notification.findOne({
                userId: b.userId,
                type: 'upcoming_booking',
                'metadata.bookingId': b._id,
            });
            if (!exists) {
                await notification_model_js_1.Notification.create({
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
        const endingSoonBookings = await booking_model_js_1.Booking.find({
            status: 'checked_in',
            endTime: { $gte: now, $lte: next2Hours },
        });
        for (const b of endingSoonBookings) {
            const exists = await notification_model_js_1.Notification.findOne({
                userId: b.userId,
                type: 'return_reminder',
                'metadata.bookingId': b._id,
            });
            if (!exists) {
                await notification_model_js_1.Notification.create({
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
        const overdueBookings = await booking_model_js_1.Booking.find({
            status: { $in: ['checked_in', 'return_pending'] },
            endTime: { $lt: now },
            checkedOut: false,
        });
        for (const b of overdueBookings) {
            b.isOverdue = true;
            await b.save();
            const exists = await notification_model_js_1.Notification.findOne({
                userId: b.userId,
                type: 'overdue_alert',
                'metadata.bookingId': b._id,
            });
            if (!exists) {
                await notification_model_js_1.Notification.create({
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
    }
    catch (error) {
        next(error);
    }
};
exports.triggerNotificationCheck = triggerNotificationCheck;
// 5. Delete Single Notification
const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        await notification_model_js_1.Notification.findOneAndDelete({
            _id: id,
            $or: [{ userId: req.user?._id }, { targetRole: 'all' }, { targetRole: req.user?.role }],
        });
        res.status(200).json({
            success: true,
            message: 'Notification removed successfully.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotification = deleteNotification;
// 6. Clear All Notifications for Current User
const clearAllNotifications = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        await notification_model_js_1.Notification.deleteMany({
            $or: [{ userId: req.user._id }, { targetRole: 'all' }, { targetRole: req.user.role }],
        });
        res.status(200).json({
            success: true,
            message: 'All notifications cleared.',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.clearAllNotifications = clearAllNotifications;
