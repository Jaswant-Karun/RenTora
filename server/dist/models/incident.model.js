"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Incident = void 0;
const mongoose_1 = require("mongoose");
const incidentSchema = new mongoose_1.Schema({
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Resource',
    },
    resourceName: {
        type: String,
        required: true,
    },
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
    },
    reportedBy: {
        type: String,
        required: true,
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
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['reported', 'investigating', 'resolved', 'dismissed'],
        default: 'reported',
        index: true,
    },
    resolutionNotes: String,
    actionTaken: String,
}, {
    timestamps: true,
});
exports.Incident = (0, mongoose_1.model)('Incident', incidentSchema);
