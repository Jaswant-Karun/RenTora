"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const auditEntrySchema = new mongoose_1.Schema({
    transition: { type: String, required: true },
    fromStatus: { type: String, required: true },
    toStatus: { type: String, required: true },
    performedBy: { type: String, required: true },
    performedByRole: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: String,
}, { _id: false });
const conditionSnapshotSchema = new mongoose_1.Schema({
    conditionNotes: { type: String, required: true },
    meterReading: String,
    cleanliness: { type: String, enum: ['passed', 'needs_cleaning'], default: 'passed' },
    operationalStatus: { type: String, enum: ['optimal', 'minor_wear', 'damaged', 'offline'], default: 'optimal' },
    photos: { type: [String], default: [] },
    userConfirmation: { type: Boolean, default: false },
    ownerConfirmation: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
    recordedBy: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now },
}, { _id: false });
const bookingSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    userDepartment: String,
    userInstitution: String,
    userEligibility: {
        type: String,
        default: 'Verified Institutional Student',
    },
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Resource',
        required: true,
        index: true,
    },
    resourceName: {
        type: String,
        required: true,
    },
    resourceCategory: {
        type: String,
        required: true,
    },
    resourceLocation: {
        type: String,
        required: true,
    },
    resourceImage: {
        type: String,
        default: '',
    },
    date: {
        type: String,
        required: true,
        index: true,
    },
    timeSlot: {
        type: String,
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
        index: true,
    },
    endTime: {
        type: Date,
        required: true,
        index: true,
    },
    durationHours: {
        type: Number,
        default: 1,
    },
    purpose: {
        type: String,
        required: [true, 'Purpose of reservation is required'],
    },
    projectDescription: String,
    expectedDuration: String,
    additionalInformation: String,
    supervisorName: {
        type: String,
        default: 'Faculty Sponsor',
    },
    trainingAcknowledged: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: [
            'pending',
            'under_review',
            'approved',
            'rejected',
            'waitlisted',
            'checked_in',
            'return_pending',
            'completed',
            'cancelled',
            'overdue',
            'active', // legacy compatibility
        ],
        default: 'pending',
        index: true,
    },
    rejectionReason: String,
    cancellationReason: String,
    waitlistReason: String,
    waitlistPriority: {
        type: Number,
        default: 1,
    },
    queuePosition: Number,
    estimatedReleaseTime: Date,
    monopolisationDetected: {
        type: Boolean,
        default: false,
    },
    managerOverrideReason: String,
    managerOverriddenBy: String,
    notes: String,
    checkedIn: {
        type: Boolean,
        default: false,
    },
    checkedInAt: Date,
    initialCondition: conditionSnapshotSchema,
    returnInitiated: {
        type: Boolean,
        default: false,
    },
    returnInitiatedAt: Date,
    returnCondition: conditionSnapshotSchema,
    checkedOut: {
        type: Boolean,
        default: false,
    },
    checkedOutAt: Date,
    conditionOnCheckout: String,
    conflictDetected: {
        type: Boolean,
        default: false,
    },
    isOverdue: {
        type: Boolean,
        default: false,
    },
    auditTrail: {
        type: [auditEntrySchema],
        default: [],
    },
}, {
    timestamps: true,
});
// Compound index for high performance overlap checks and preventing concurrent double booking
bookingSchema.index({ resourceId: 1, startTime: 1, endTime: 1, status: 1 });
bookingSchema.index({ userId: 1, status: 1 });
exports.Booking = (0, mongoose_1.model)('Booking', bookingSchema);
