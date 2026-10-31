"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FairShareDecision = void 0;
const mongoose_1 = require("mongoose");
const fairShareDecisionSchema = new mongoose_1.Schema({
    bookingId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, default: 'student' },
    userDepartment: String,
    userQualification: String,
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Resource',
        required: true,
        index: true,
    },
    resourceName: { type: String, required: true },
    institution: { type: String, required: true, index: true },
    date: { type: String, required: true },
    timeSlot: { type: String, required: true },
    startTime: Date,
    endTime: Date,
    explanation: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true,
    },
    finalDecision: {
        type: String,
        required: true,
        enum: ['APPROVED', 'PENDING_REVIEW', 'WAITLISTED', 'REJECTED'],
        index: true,
    },
    reason: { type: String, required: true },
    isOverridden: { type: Boolean, default: false },
    overriddenBy: String,
    overrideReason: String,
    overriddenAt: Date,
}, {
    timestamps: true,
});
fairShareDecisionSchema.index({ institution: 1, createdAt: -1 });
fairShareDecisionSchema.index({ resourceId: 1, date: 1 });
exports.FairShareDecision = (0, mongoose_1.model)('FairShareDecision', fairShareDecisionSchema);
