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
