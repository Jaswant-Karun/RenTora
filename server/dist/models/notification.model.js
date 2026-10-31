"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    targetRole: {
        type: String,
        default: 'all',
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    type: {
        type: String,
        enum: [
            'booking_confirmed',
            'approval',
            'rejection',
            'waitlist_update',
            'upcoming_booking',
            'return_reminder',
            'overdue_alert',
            'incident_update',
            'booking',
            'maintenance',
            'system',
        ],
        default: 'system',
        index: true,
    },
    link: {
        type: String,
        default: '',
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
