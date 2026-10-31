"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Incident = void 0;
const mongoose_1 = require("mongoose");
const incidentSchema = new mongoose_1.Schema({
    incidentNumber: {
        type: String,
        unique: true,
        index: true,
        trim: true,
    },
    category: {
        type: String,
        enum: [
            'equipment_damage',
            'delayed_return',
            'late_return',
            'missing_components',
            'equipment_malfunction',
            'safety_concerns',
            'disputes',
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
    conditionReportBeforeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ConditionReport',
    },
    conditionReportAfterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'ConditionReport',
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
        enum: ['reported', 'investigating', 'decision_pending', 'resolved', 'dismissed'],
        default: 'reported',
        index: true,
    },
    requiresHumanReview: {
        type: Boolean,
        default: true,
    },
    investigationNotes: [
        {
            authorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
            authorName: { type: String, required: true },
            authorRole: { type: String, default: 'Investigator' },
            note: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    decision: {
        outcome: {
            type: String,
            enum: ['no_fault', 'user_responsible', 'fair_wear_and_tear', 'equipment_defect', 'under_review'],
        },
        decidedBy: { type: String },
        decidedAt: { type: Date },
        rationale: { type: String },
        sanctions: { type: String },
    },
    resolution: {
        summary: { type: String },
        resolvedBy: { type: String },
        resolvedAt: { type: Date },
        actionTaken: { type: String },
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
incidentSchema.pre('validate', function (next) {
    if (!this.incidentNumber) {
        const year = new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        const timeSlice = Date.now().toString().slice(-4);
        this.incidentNumber = `INC-${year}-${timeSlice}${rand}`;
    }
    next();
});
incidentSchema.index({ status: 1, severity: 1, createdAt: -1 });
incidentSchema.index({ resourceId: 1, status: 1 });
exports.Incident = (0, mongoose_1.model)('Incident', incidentSchema);
