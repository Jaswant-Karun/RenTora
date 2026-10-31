"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationRead = exports.getNotifications = void 0;
const notification_model_js_1 = require("../models/notification.model.js");
const getNotifications = async (req, res, next) => {
    try {
        const user = req.user;
        const query = {};
        if (user) {
            query.$or = [{ userId: user._id }, { targetRole: 'all' }, { targetRole: user.role }];
        }
        const notifications = await notification_model_js_1.Notification.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: notifications,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
const markNotificationRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const notification = await notification_model_js_1.Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
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
