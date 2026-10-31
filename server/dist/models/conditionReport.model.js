"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionReport = void 0;
const mongoose_1 = require("mongoose");
const conditionReportSchema = new mongoose_1.Schema({
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
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true,
    },
    inspectorName: {
        type: String,
        required: true,
    },
    inspectorRole: {
        type: String,
        default: 'Lab Custodian',
    },
    responsibleUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    responsibleUserName: {
        type: String,
        default: '',
    },
    responsibleUserEmail: {
        type: String,
        default: '',
    },
    type: {
        type: String,
        enum: ['check_in', 'check_out', 'routine'],
        default: 'check_out',
        index: true,
    },
    operationalStatus: {
        type: String,
        enum: ['optimal', 'minor_wear', 'damaged', 'offline'],
        default: 'optimal',
    },
    cleanliness: {
        type: String,
        enum: ['passed', 'needs_cleaning'],
        default: 'passed',
    },
    meterReading: {
        type: String,
        default: '0',
    },
    existingDamage: {
        type: [String],
        default: [],
    },
    conditionNotes: {
        type: String,
        default: '',
    },
    observations: {
        type: String,
        required: true,
    },
    photos: {
        type: [String],
        default: [],
    },
    differences: {
        hasDifferences: { type: Boolean, default: false },
        summary: { type: String, default: '' },
        items: [
            {
                category: { type: String },
                before: { type: String },
                after: { type: String },
                requiresReview: { type: Boolean, default: true },
            },
        ],
    },
    requiresHumanReview: {
        type: Boolean,
        default: false,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true,
    },
    userConfirmation: {
        type: Boolean,
        default: false,
    },
    userConfirmedAt: {
        type: Date,
    },
    ownerConfirmation: {
        type: Boolean,
        default: false,
    },
    ownerConfirmedAt: {
        type: Date,
    },
    signoffConfirmed: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
exports.ConditionReport = (0, mongoose_1.model)('ConditionReport', conditionReportSchema);
