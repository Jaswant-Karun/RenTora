"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Incident = void 0;
const mongoose_1 = require("mongoose");
const incidentSchema = new mongoose_1.Schema({
    category: {
        type: String,
        enum: [
            'equipment_damage',
            'late_return',
            'missing_components',
            'misuse',
            'scheduling_conflicts',
            'other',
        ],
        default: 'other',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Incident description is required'],
        trim: true,
    },
    evidence: {
        type: [String],
        default: [],
    },
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true,
    },
    bookingReference: {
        type: String,
        default: '',
        trim: true,
    },
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Resource',
        index: true,
    },
    resourceName: {
        type: String,
        required: true,
        default: 'General Resource',
    },
    reportedBy: {
        type: String,
        required: true,
    },
    reportedByUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    reportedByRole: {
        type: String,
        default: 'student',
    },
    userEmail: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
        index: true,
    },
    status: {
        type: String,
        enum: ['reported', 'investigating', 'resolved', 'dismissed'],
        default: 'reported',
        index: true,
    },
    managerResponse: {
        type: String,
        default: '',
    },
    resolutionNotes: {
        type: String,
        default: '',
    },
    sanctionsApplied: {
        type: String,
        default: 'none',
    },
    actionTaken: {
        type: String,
        default: '',
    },
    resolvedAt: Date,
    resolvedBy: String,
}, {
    timestamps: true,
});
incidentSchema.index({ status: 1, severity: 1, createdAt: -1 });
incidentSchema.index({ resourceId: 1, status: 1 });
exports.Incident = (0, mongoose_1.model)('Incident', incidentSchema);
