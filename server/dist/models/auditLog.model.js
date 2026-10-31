"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    action: {
        type: String,
        required: true,
        index: true,
        enum: [
            'RESOURCE_CREATION',
            'RESOURCE_UPDATE',
            'RESOURCE_ARCHIVED',
            'RESOURCE_DISABLED',
            'BOOKING_REQUEST',
            'BOOKING_APPROVAL',
            'BOOKING_REJECTION',
            'BOOKING_CANCELLATION',
            'BOOKING_ALTERNATIVE_SUGGESTED',
            'CHECK_IN',
            'CHECK_OUT',
            'CONDITION_REPORT',
            'INCIDENT_REPORT',
            'INCIDENT_RESOLUTION',
            'MANAGER_DECISION',
            'MANAGER_OVERRIDE',
            'WAITLIST_ENQUEUE',
            'WAITLIST_PROMOTION',
        ],
    },
    entityType: {
        type: String,
        required: true,
        index: true,
        enum: ['Resource', 'Booking', 'ConditionReport', 'Incident', 'User', 'Policy', 'System'],
    },
    entityId: {
        type: String,
        index: true,
    },
    entityTitle: {
        type: String,
        default: '',
    },
    actorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    actorName: {
        type: String,
        required: true,
    },
    actorEmail: {
        type: String,
    },
    actorRole: {
        type: String,
        required: true,
        default: 'system',
    },
    ipAddress: {
        type: String,
        default: '127.0.0.1',
    },
    details: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    reason: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    isImmutable: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: { createdAt: true, updatedAt: false }, // No updatedAt since audit entries cannot change
});
// Enforce strict database-level immutability: Disallow updates and deletions
auditLogSchema.pre('updateOne', function (next) {
    next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be modified.'));
});
auditLogSchema.pre('updateMany', function (next) {
    next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be modified.'));
});
auditLogSchema.pre('findOneAndUpdate', function (next) {
    next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be modified.'));
});
auditLogSchema.pre('findOneAndDelete', function (next) {
    next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be deleted.'));
});
auditLogSchema.pre('deleteOne', function (next) {
    next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be deleted.'));
});
auditLogSchema.pre('deleteMany', function (next) {
    next(new Error('IMMUTABILITY_VIOLATION: Audit log records are permanent and cannot be deleted.'));
});
// Non-repudiation chronological and entity investigation indexes
auditLogSchema.index({ timestamp: -1, action: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
exports.AuditLog = (0, mongoose_1.model)('AuditLog', auditLogSchema);
